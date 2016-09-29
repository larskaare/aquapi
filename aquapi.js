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
    statusled,
    photoresistor,
    watersensor,
    watertemperature,
    motion,
    externalLight,
    externalTempC,
    externalPressure,
    externalHumidity;

mytft.init();

var latestReady = false;

//Defining board for reading sensors
board = new five.Board({
    repl: false,
    debug: false
});

board.on("ready", function() {
    logger.info('Board ready for action');

    var aquaDataSampler = new aquaData.aquaData(Date.now(), 0, 0, 0, 0, 0, 0, 0, 0);

    //Defining Statusled
    statusled = new five.Led.RGB({
        pins: {
            red: 3,
            green: 6,
            blue: 5,
        }
    });

    statusled.on();
    statusled.color("blue");

    //Define motion sensor
    var motion = new five.Motion({
        pin: 7
    });

    //Drawing in the pitft
    this.loop(config.get('pitft:redrawSpeed'), function() {
        fillAquaDataSampler(aquaDataSampler);
        mytft.drawSensorValuesOnScreen(latestReady, aquaDataSampler);
    });

    //Defining sensors
    externalTempC = new five.Thermometer({
        controller: "BME280",
        freq: config.get('SensorSamplingRate')
    });

    //externalLight = new five.Light({
    //   controller: "TSL2561"
    // });

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

    //Handling motion
    motion.on("calibrated", function() {
        logger.info('Motion calibrated');
    });

    motion.on("motionstart", function() {
        statusled.strobe(250);
        aquaDataSampler.motions = aquaDataSampler.motions + 1;
        latestReady = false;
        snapshot.takeSnapshot(function callback(err) {
            if (err) {
                logger.info('Unable to take camera snapshot ', err);
            }
            latestReady = true;
        });
        logger.info('Motion detected (' + aquaDataSampler.motions + ')');
    });

    motion.on("motionend", function() {
        logger.info('Motion end');
        statusled.stop();
    });

});

// A housekeeping loop for the displaying snapshots on the pitft
setInterval(function() {
    latestReady = false;
}, config.get('pitft:snapShotDrawFrequency'));

//Sending off sensor samples to elastic
setInterval(function() {
    var aquaDataToStore = new aquaData.aquaData(Date.now(), 0, 0, 0, 0, 0, 0, 0, 0);

    if (board.isReady) {

        fillAquaDataSampler(aquaDataToStore);
        aquaDataToStore = JSON.parse(JSON.stringify(aquaDataToStore));

        statusled.color("green");

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
    //filling the aquaDataSampler
    aquaDataSampler.timestamp = Date.now();
    aquaDataSampler.aquariumLightlevel = photoresistor.scaleTo([0, 255]);
    aquaDataSampler.aquariumWatertemperatureCelsius = watertemperature.celsius;
    aquaDataSampler.aquariumWaterSensor = watersensor.scaleTo([0, 255]);
    aquaDataSampler.externalLight = 0; //Not yet
    aquaDataSampler.externalTempC = externalTempC.celsius;
    aquaDataSampler.externalPressure = externalPressure.pressure;
    aquaDataSampler.externalHumidity = externalHumidity.relativeHumidity;
    aquaDataSampler.motions = 0; //Aggregate and send of num of motions since last mnotion?
}
