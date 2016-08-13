"use strict";

const NhacUpdater = function() {
    const request = require('request');
    const util = require('util');
    const moment = require('moment');
    const config = require('./ConfigStore.js');
    const connection = require('./DatabaseAccessor.js');
    const logger = require('./Logger.js')('NhacUpdater');
    const Rx = require('rx');

    const url_format = 'http://api.mp3.zing.vn/api/mobile/charts/getchartsinfo?keycode=%s&requestdata={"week":%s,"id":%d,"year":%s,"start":0,"length":40}&fromvn=0';

    this.update = function() {
        return this.getSongs().flatMap(function(songs) {
            return connection.insert(songs);
        });
    }

    this.getSongs = function() {

        const key = config.Zing.apiKey;

        const weekNumber = moment().format("W");
        const year = moment().format("gggg");
        const url = util.format(url_format, key, weekNumber, 1, year);

        logger.info('Getting latest songs for week %s/%s.', weekNumber, year);
        logger.info('Requesting %s.', url);

        return Rx.Observable.create(function(obs) {


            request(url, function(err, response, body) {
                if (!err && response.statusCode == 200) {
                    const result = JSON.parse(body);
                    const week = result.week;
                    const songs = result.item;
                    logger.info("Received response: %d songs.", songs.length);

                    obs.onNext(songs);
                    obs.onCompleted();
                } else {
                    logger.error("Error: %s. Response: %s. Body: %s", err, util.inspect(response), util.inspect(body));
                    obs.onError();
                }
            });
        });
    };
};

module.exports = new NhacUpdater();
