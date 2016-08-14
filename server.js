"use strict";

const NhacUpdater = require("./NhacUpdater.js");
const later = require('later');
const LogFactoryType = require('./LogFactory.js');
const config = require('./ConfigStore.js');

const logFactory = new LogFactoryType(config);
const logger = logFactory.createLogger('server');

const nhacUpdater = new NhacUpdater(logFactory);

const scheduler = later.parse.text(config.schedule);

// heart beat
later.setInterval(publishHeartbeat, later.parse.text("every 10 mins"));

logger.info("Starting one immediate run");
execute().subscribe(function(x) {}, function(err) {}, function() {

    logger.info("Scheduled run set " + config.schedule);
    later.setInterval(execute, scheduler);

});

function execute() {
    logger.info("Run started.");
    return nhacUpdater.update().doOnError(function(err) {
        logger.error('Error while updating songs: ' + err);
        logger.info('Finished scheduled run. Waiting for next run');
        logger.info('===============================================================');

    }).doOnCompleted(function() {
        logger.info('Finished scheduled run. Waiting for next run');
        logger.info('===============================================================');
    });
}

function publishHeartbeat(){
  logger.info("Heartbeat message. App is still alive");
}
