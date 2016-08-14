"use strict";

const request = require('request');
const util = require('util');
const moment = require('moment');
const Connection = require('./DatabaseAccessor.js');
const Rx = require('rx');


class NhacUpdater {
  
  constructor(logFactory, apiKey, dbConfig) {
    this.logger = logFactory.createLogger('NhacUpdater');
    this.connection = new Connection(logFactory, dbConfig);
    this.apiKey = apiKey; 
  }

  update() {
    return this.getSongs().flatMap(songs => {
      return this.connection.insert(songs);
    });
  }

  getSongs() {

        const url_format = 'http://api.mp3.zing.vn/api/mobile/charts/getchartsinfo?keycode=%s&requestdata={"week":%s,"id":%d,"year":%s,"start":0,"length":40}&fromvn=0';

        const weekNumber = moment().format("W");
        const year = moment().format("gggg");
        const url = util.format(url_format, this.apiKey, weekNumber, 1, year);

        this.logger.info('Getting latest songs for week %s/%s.', weekNumber, year);
        this.logger.info('Requesting %s.', url);

        return Rx.Observable.create(obs => {
            request(url, (err, response, body) => {
                if (!err && response.statusCode == 200) {
                    const result = JSON.parse(body);
                    const week = result.week;
                    const songs = result.item;
                    
                    this.logger.info("Received response: %d songs.", songs.length);

                    obs.onNext(songs);
                    obs.onCompleted();
                } else {
                    this.logger.error("Error: %s. Response: %s. Body: %s", err, util.inspect(response), util.inspect(body));
                    obs.onError();
                }
            });
        });
    };
};

module.exports = NhacUpdater;
