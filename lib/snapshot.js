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

var child_process = require('child_process');
var im = require('imagemagick');
var s3 = require('aws');
var fs = require('fs');
var config = require("configger");


function takeSnapshot(cb) {
    logger.info('Preparing to take camera snapshot');
    var timestamp = Date.now();
    var rawFilename = config.get('camera:fileprefix') + timestamp + ".jpg";
    var filename = config.get('camera:path') + rawFilename;
    var filenameLatest = config.get('camera:path') + 'latest.png';

    var args = ['-o', filename, '-t', '1', '--nopreview'];
    var spawn = child_process.spawn('raspistill', args);

    spawn.on('exit', function(code) {
        logger.info('A snapshot is saved as ' + filename + ' with exit code, ' + code);
        var timestamp = Date.now();

        logger.info('Converting snaphot for pitft screen');
        im.convert([filename, '-resize', '320x240', filenameLatest],
            function(err, metadata) {
                if (err) {
                    return cb(err);
                    //throw err;
                }
                return cb(null);
            });

        logger.info('Preparing to upload snapshot to s3 cloud');
        s3.s3Upload(filename, rawFilename);

    });

    spawn.stdout.on('data', (data) => {
        logger.info('Snapshot function: ' + data);
    });

    spawn.stderr.on('data', (data) => {
        logger.info('Snapshot function error: ' + data);
    });
}
exports.takeSnapshot = takeSnapshot;
