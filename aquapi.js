'use strict';
/*jslint node: true */
/*jshint esversion: 6 */

require('app-module-path').addPath(process.env.PWD + '/lib');

var winston = require('winston');
var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)({
            'timestamp': true,
            'colorize': true
        })
    ]
});

var elastic = require('elasticsearch');
var snapshot = require('snapshot');
var mytft = require('mypitft');
var aquaData = require('aquadata');
var five = require("johnny-five");
var config = require("configger");

var board,
    motionLaser,
    photoresistor,
    watersensor,
    watertemperature,
    motions,
    externalLight,
    externalTempC,
    externalPressure,
    externalHumidity;

mytft.init();

var latestReady = false;
var readyForSnapshot = true;
var throttleTimer;

//Defining board for reading sensors
board = new five.Board({
    repl: false,
    debug: false
});

board.on("ready", function() {
    logger.info('Board ready for action');

    var laserMotionThreshold = config.get('LaserMotionThreshold');
    var brokenLaserBeam = false;
    logger.info("Laser sensor threshold is set to ", laserMotionThreshold);

    var aquaDataSampler = new aquaData.aquaData(Date.now(), 0, 0, 0, 0, 0, 0, 0, 0);

    logger.info('Defining and turning on motionLaser sensor');
    motionLaser = new five.Led({
        pin: 9
    });

    motionLaser.on();
    motions = 0;

    //Defining sensors
    externalTempC = new five.Thermometer({
        controller: "BME280",
        freq: config.get('SensorSamplingRate')
    });

    externalLight = new five.Light({
        controller: "TSL2561"
    });

    photoresistor = new five.Sensor({
        pin: "A0",
        freq: config.get('SensorSamplingRate')
    });

    watersensor = new five.Sensor({
        pin: "A1",
        freq: config.get('SensorSamplingRate')
    });

    watertemperature = new five.Thermometer({
        controller: "DS18B20",
        pin: 2,
        freq: config.get('SensorSamplingRate')
    });

    externalHumidity = new five.Hygrometer({
        controller: "BME280",
        freq: config.get('SensorSamplingRate')
    });

    externalPressure = new five.Barometer({
        controller: "BME280",
        freq: config.get('SensorSamplingRate')
    });


    photoresistor.on("change", function() {
        if (photoresistor.value > laserMotionThreshold) {

            if (!brokenLaserBeam) {
                logger.info("Laser beam broken, we have movement (" + photoresistor.value + ")");
                brokenLaserBeam = true;
                motions++;

                latestReady = false;
                if (readyForSnapshot) {
                    setSnapshotThrottleTimer(true);

                    snapshot.takeSnapshot(function callback(err) {
                        if (err) {
                            logger.info('Unable to take camera snapshot ', err);
                            latestReady = false;
                        } else {
                            latestReady = true;
                        }
                    });
                }
            }

        } else {
            if (brokenLaserBeam) {
                logger.info("Laser beam set to unbroken");
                brokenLaserBeam = false;
            }
        }

    });

    //Drawing in the pitft
    this.loop(config.get('pitft:redrawSpeed'), function() {
        fillAquaDataSampler(aquaDataSampler);
        mytft.drawSensorValuesOnScreen(latestReady, aquaDataSampler);
    });


});

// A housekeeping loop for the displaying snapshots on the pitft
setInterval(function() {
    latestReady = false;
}, config.get('pitft:snapShotDrawFrequency'));

// A snapshot throttle timer
function setSnapshotThrottleTimer(operation) {
    var throttleTime = config.get('SnapshotThrottleTime') || 30000;

    if (operation) {
        logger.info("Setting snapshot throttle ", throttleTime, "msec");
        readyForSnapshot = false;
        throttleTimer = setInterval(function() {
            readyForSnapshot = true;
            logger.info("Releaseing snapshot throttle");
        }, throttleTime);
    }
}

//Sending off sensor samples to elastic
setInterval(function() {
    var aquaDataToStore = new aquaData.aquaData(Date.now(), 0, 0, 0, 0, 0, 0, 0, 0);

    if (board.isReady) {

        fillAquaDataSampler(aquaDataToStore);
        motions = 0;
        aquaDataToStore = JSON.parse(JSON.stringify(aquaDataToStore));

        elastic.addDocument(aquaDataToStore, function(err, data) {
            if (err) {
                logger.info('ES: Not able to store data :', err);
            } else {
                logger.info('ES: Data stored ok ', aquaDataToStore);
            }

        });

    }
}, config.get('SendSensorRate'));

function fillAquaDataSampler(aquaDataSampler) {
    aquaDataSampler.timestamp = Date.now();
    aquaDataSampler.aquariumLightlevel = photoresistor.scaleTo([0, 255]);
    aquaDataSampler.aquariumWatertemperatureCelsius = watertemperature.celsius;
    aquaDataSampler.aquariumWaterSensor = watersensor.scaleTo([0, 255]);
    aquaDataSampler.externalLight = externalLight.lux;
    aquaDataSampler.externalTempC = externalTempC.celsius;
    aquaDataSampler.externalPressure = externalPressure.pressure;
    aquaDataSampler.externalHumidity = externalHumidity.relativeHumidity;
    aquaDataSampler.motions = motions;
}
