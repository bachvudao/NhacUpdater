"use strict";

const bunyan = require('bunyan');
const config = require('./ConfigStore.js');

const defaultLogger = bunyan.createLogger({
    name: 'app',
    streams: [{
        level: 'info',
        stream: process.stdout
    }, {
        level: 'info',
        type: 'rotating-file',
        path: config.logging.fileLocation,
        period: '1d',
        count: 10
    }]
});

defaultLogger.info("Set up logging to file " + config.logging.fileLocation);

defaultLogger.info("Initialized logging");

const createLogger = function(name) {
    return name ? defaultLogger.child({
        layer: name
    }) : defaultLogger;
}

module.exports = createLogger;
