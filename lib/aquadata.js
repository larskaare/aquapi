'use strict';
/*jslint node: true */
/*jshint esversion: 6 */

require('app-module-path').addPath(process.env.PWD + '/lib');

function aquaData(timestamp,
    aquariumLightlevel,
    aquariumWatertemperatureCelsius,
    aquariumWaterSensor,
    motions,
    externalLight,
    externalTempC,
    externalPressure,
    externalHumidity) {
    /*jshint validthis:true */
    this.timestamp = timestamp;
    this.aquariumLightlevel = aquariumLightlevel;
    this.aquariumWatertemperatureCelsius = aquariumWatertemperatureCelsius;
    this.aquariumWaterSensor = aquariumWaterSensor;
    this.externalLight = externalLight;
    this.externalTempC = externalTempC;
    this.externalPressure = externalPressure;
    this.externalHumidity = externalHumidity;
    this.motions = motions;
}

exports.aquaData = aquaData;
