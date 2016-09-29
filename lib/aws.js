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

var config = require("configger");
var s3 = require('s3');

var client = s3.createClient({
    maxAsyncS3: 20, // this is the default 
    s3RetryCount: 3, // this is the default 
    s3RetryDelay: 1000, // this is the default 
    multipartUploadThreshold: 20971520, // this is the default (20 MB) 
    multipartUploadSize: 15728640, // this is the default (15 MB) 
    s3Options: {
        accessKeyId: config.get('AWS_ACCESSKEYID'),
        secretAccessKey: config.get('AWS_SECRETACCESSKEY'),
    },
});


function s3Upload(localFilename, filename) {
    var params = {
        localFile: localFilename,

        s3Params: {
            Bucket: config.get('s3:bucket'),
            Key: config.get('s3:key') + filename,
        },
    };

    var uploader = client.uploadFile(params);
    uploader.on('error', function(err) {
        logger.info("Unable to upload file to s3 ", err.stack);
    });
    uploader.on('progress', function() {
        //logger.info("progress", uploader.progressMd5Amount,
        //          uploader.progressAmount, uploader.progressTotal);
    });
    uploader.on('end', function() {
        logger.info('File uploaded to s3 ' + localFilename);
    });
}
exports.s3Upload = s3Upload;
