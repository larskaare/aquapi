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

var configger = require('nconf');

// Loading from commandline, environment and then file - with presedence!

logger.info('Loading config');

configger.argv();
configger.env();
configger.file({
    file: './config/config.json'
});

logger.info('Config loaded');

module.exports = configger;
