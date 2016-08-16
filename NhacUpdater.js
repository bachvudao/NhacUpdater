"use strict";

const request = require('request');
const util = require('util');
const moment = require('moment');
const Connection = require('./DatabaseAccessor.js');
const Rx = require('rx');


class NhacUpdater {

    constructor(logFactory, apiKey, dbConfig, slackUpdater) {
        this.logger = logFactory.createLogger('NhacUpdater');
        this.connection = new Connection(logFactory, dbConfig);
        this.slackUpdater = slackUpdater;
        this.apiKey = apiKey;
    }

    update() {
        return this.getSongs().flatMap(songs => {
            return this.connection.insert(songs);
        }).doOnError(err => {
            this.notify("Error while updating songs.");
        }).finally(() => {
            this.notify("Finished updating songs.");
        });
    }

    getSongs() {

        const url_format = 'http://api.mp3.zing.vn/api/mobile/charts/getchartsinfo?keycode=%s&requestdata={"week":%s,"id":%d,"year":%s,"start":0,"length":40}&fromvn=0';

        const weekNumber = moment().format("W");
        const year = moment().format("gggg");
        const url = util.format(url_format, this.apiKey, weekNumber, 1, year);

        const startingMessage = 'Getting latest songs for week ' + weekNumber + '/' + year;
        this.notify('Starting NhacUpdater: ' + startingMessage);
        this.logger.info(startingMessage);
        this.logger.info('Requesting %s.', url);

        return Rx.Observable.create(obs => {
            request(url, (err, response, body) => {
                if (!err && response.statusCode == 200) {
                    const result = JSON.parse(body);
                    const week = result.week;
                    const songs = result.item;

                    this.logger.info("Received response: %d songs.", songs.length);
                    
                    this.notify("Number of songs to update: " + songs.length);

                    obs.onNext(songs);
                    obs.onCompleted();
                } else {
                    this.logger.error({err: err, res: response}, "Error while getting songs");
                    obs.onError();
                }
            });
        });
    }

    notify(message) {
        if (this.slackUpdater) {
            this.slackUpdater.sendMessage(message);
        }
    }
};

module.exports = NhacUpdater;
