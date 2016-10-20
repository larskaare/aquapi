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

var pitft = require("pitft");
var fs = require('fs');
var dateFormat = require('dateformat');
var config = require("configger");
var myIpStr;

var fb,
    xMax,
    yMax;

var init = function() {
    fb = pitft(config.get('pitft:devicePath'));
    fb.clear();

    xMax = fb.size().width;
    yMax = fb.size().height;
    logger.info('Initialized pi tft screen (' + xMax + 'X' + yMax + ')');

    myIpStr = getIpAdresses();
    logger.info('Getting my ip address :', myIpStr);
};
module.exports.init = init;

var drawSensorValuesOnScreen = function(latestReady, aquaDataSampler) {
    var filenameLatest = config.get('camera:path') + 'latest.png';

    fb.clear();

    if (fs.existsSync(filenameLatest) && latestReady) {
        try {
            fb.image(1, 1, filenameLatest);
        } catch (err) {
            logger.info("Unable to draw latest image on pitft");
        }

    }

    fb.color(255, 0, 0);
    fb.font("roboto", 20);

    fb.text(0, 20, "Lightlevel", false, 0);
    fb.text(190, 20, ": " + aquaDataSampler.aquariumLightlevel, false, 0);

    fb.text(0, 40, "Water temp:", false, 0);
    fb.text(190, 40, ": " + aquaDataSampler.aquariumWatertemperatureCelsius.toFixed(2) + "C", false, 0);

    fb.text(0, 60, "Water sensor:", false, 0);
    fb.text(190, 60, ": " + aquaDataSampler.aquariumWaterSensor, false, 0);

    if (aquaDataSampler.motions > 0) {
        fb.text(0, 80, "Motion detected:", false, 0);
        fb.color(0, 255, 0);
        fb.text(190, 80, ": " + aquaDataSampler.motions, false, 0);
        fb.color(255, 0, 0);
    } else {
        fb.color(255, 0, 0);
        fb.text(0, 80, "Motion detected:", false, 0);
        fb.text(190, 80, ": " + aquaDataSampler.motions, false, 0);
    }

    fb.text(0, 100, "Light level (lux):", false, 0);
    fb.text(190, 100, ": " + aquaDataSampler.externalLight, false, 0);

    fb.text(0, 120, "External temp:", false, 0);
    fb.text(190, 120, ": " + aquaDataSampler.externalTempC.toFixed(2) + "C", false, 0);

    fb.text(0, 140, "External pressure:", false, 0);
    fb.text(190, 140, ": " + aquaDataSampler.externalPressure.toFixed(2) + "kPa", false, 0);

    fb.text(0, 160, "External humidity:", false, 0);
    fb.text(190, 160, ": " + aquaDataSampler.externalHumidity.toFixed(2) + "%", false, 0);

    fb.color(0, 128, 255);
    fb.text(20, 200, myIpStr, false, 0);

    fb.color(0, 128, 255);
    fb.text(20, 220, dateFormat(Date.now()), false, 0);

};
module.exports.drawSensorValuesOnScreen = drawSensorValuesOnScreen;

function getIpAdresses() {
    var os = require('os');
    var ifaces = os.networkInterfaces();


    var ipStr = "";

    Object.keys(ifaces).forEach(function(ifname) {
        var alias = 0;

        ifaces[ifname].forEach(function(iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }

            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                ipStr = ipStr + " " + iface.address;
            } else {
                // this interface has only one ipv4 adress
                ipStr = iface.address;
            }
            ++alias;
        });
    });
    return ipStr;

}
