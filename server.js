var NhacUpdater = require("./NhacUpdater.js");
var later = require('later');
var logger = require('./Logger.js');
var configProvider = require('./NhacUpdaterConfig.js');

var config = configProvider.read();
var scheduler = later.parse.text(config.schedule);

logger.info("Strarting one immediate run");
execute();


logger.info("Scheduled run set " + config.schedule);
later.setInterval(execute, scheduler);

function execute() {
    logger.info("Scheduled run started.");
    NhacUpdater.update().subscribe(function(x) {}, function(err) {
        logger.error('Error while updating songs: ' + err);
        logger.info('Finished scheduled run. Waiting for next run');
        logger.info('===============================================================');

    }, function() {
        logger.info('Finished scheduled run. Waiting for next run');
        logger.info('===============================================================');
    })
}
