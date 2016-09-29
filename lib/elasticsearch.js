'use strict';
/*jslint node: true */
/*jshint esversion: 6 */

require('app-module-path').addPath(process.env.PWD + '/lib');

var config = require("configger");
var Elasticsearch = require('aws-es');
var indexName = config.get('ew:indexName');

var elasticClient = new Elasticsearch({
    accessKeyId: config.get('AWS_ACCESSKEYID'),
    secretAccessKey: config.get('AWS_SECRETACCESSKEY'),
    service: config.get('es:service'),
    region: config.get('es:region'),
    host: config.get('ES_HOST'),
});

/* Add new document to index */
function addDocument(aquadata, callback) {

    elasticClient.index({
        index: config.get('es:indexName'),
        type: 'posts',
        body: aquadata
    }, function(err, data) {
        callback(err, data);
    });
}
exports.addDocument = addDocument;
