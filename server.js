var NhacUpdater = require("./NhacUpdater.js");
var later = require('later');
var logger = require('./Logger.js');
var config = require('./ConfigStore.js');

var scheduler = later.parse.text(config.schedule);

logger.info("Starting one immediate run");
execute().subscribe(function(x) {}, function(err) {}, function() {

    logger.info("Scheduled run set " + config.schedule);
    later.setInterval(execute, scheduler);

});

function execute() {
    logger.info("Run started.");
    return NhacUpdater.update().doOnError(function(err) {
        logger.error('Error while updating songs: ' + err);
        logger.info('Finished scheduled run. Waiting for next run');
        logger.info('===============================================================');

    }).doOnCompleted(function() {
        logger.info('Finished scheduled run. Waiting for next run');
        logger.info('===============================================================');
    });
}