var winston = require('winston');
var moment = require('moment');
var config = require('./ConfigStore.js');
var path = require('path');
var mkdirp = require('mkdirp');

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    timestamp: function() {
        return moment().format("YYYY-MM-DD HH:mm:ss.SSS");
    },
    colorize: true,
    formatter: function(options) {
        return options.timestamp() + ' ' + options.level.toUpperCase() + ': ' + (options.message == undefined ? ' ' : options.message);
    },
    level: 'info'
});

if (config.logging.fileLocation) {

  mkdirp.sync(path.dirname(config.logging.fileLocation));


    winston.add(winston.transports.File, {
        level: 'info',
        filename: config.logging.fileLocation,
        maxSize: 52428800, // 50 mb
        maxFiles: 10
    });

    winston.info("Set up logging to file " + config.logging.fileLocation);
}

winston.info("Initialized logging");

module.exports = winston;
