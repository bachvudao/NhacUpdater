"use strict";

const NhacUpdater = require("./NhacUpdater.js");
const later = require('later');
const LogFactoryType = require('./LogFactory.js');
const config = require('./conf.json');
const SlackNotifier = require('./SlackNotifier.js');
const Rx = require('rx');

const logFactory = new LogFactoryType(config);
const logger = logFactory.createLogger('server');

let slackNotifier = undefined;
if(config.slack){
  slackNotifier = new SlackNotifier(logFactory, config.slack);
}

const nhacUpdater = new NhacUpdater(logFactory, config.Zing.apiKey, config.db, slackNotifier);

const scheduler = later.parse.text(config.schedule);


// heart beat
later.setInterval(publishHeartbeat, later.parse.text("every 10 mins"));

const timer = new Rx.Subject();
later.setInterval(() => {timer.onNext(1);}, scheduler);

timer.startWith(0).subscribe(val => {
  execute().finally(() => {
    logger.info('Waiting for next schedule run ' + later.schedule(scheduler).next(1));
    logger.info('===============================================================');
  }).subscribe();
});

function execute() {
    logger.info("Run started.");
    return nhacUpdater.update().doOnError(err => {
        logger.error('Error while updating songs: ' + err);
    }).finally(() => {
        logger.info('Finished one run.');        
        logger.info('===============================================================');
    });
}

function publishHeartbeat(){
  logger.info("Heartbeat message. App is still alive");
}
