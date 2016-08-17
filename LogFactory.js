"use strict";

const bunyan = require('bunyan');

class LogFactory {
    constructor(config) {
        this.defaultLogger = bunyan.createLogger({
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

        this.defaultLogger.info("Set up logging to file " + config.logging.fileLocation);

        this.defaultLogger.info("Initialized logging");
    }

    createLogger(name) {
        return name ? this.defaultLogger.child({
            layer: name
        }) : this.defaultLogger;
    }
}

module.exports = LogFactory;