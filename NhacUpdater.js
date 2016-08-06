var NhacUpdater = function() {
    var request = require('request');
    var util = require('util');
    var moment = require('moment');
    var configProvider = require('./NhacUpdaterConfig.js');
    var connection = require('./DatabaseAccessor.js');
    var logger = require('./Logger.js');
    var Rx = require('rx');

    var config;

    var ensureConfig = function() {
        if (!config) {
            config = configProvider.read();
        }
    };

    this.update = function() {
        return this.getSongs().flatMap(function(songs) {
            return connection.insert(songs);
        });
    }

    this.getSongs = function() {
        ensureConfig();

        var key = config.Zing.apiKey;
        var url_format = 'http://api.mp3.zing.vn/api/mobile/charts/getchartsinfo?keycode=%s&requestdata={"week":%s,"id":%d,"year":%s,"start":0,"length":40}&fromvn=0';

        var weekNumber = moment().format("W");
        var year = moment().format("gggg");
        var url = util.format(url_format, key, weekNumber, 1, year);

        logger.info('Getting latest songs for week %s/%s.', weekNumber, year);
        logger.info('Requesting %s.', url);

        return Rx.Observable.create(function(obs) {


            request(url, function(err, response, body) {
                if (!err && response.statusCode == 200) {
                    var result = JSON.parse(body);
                    var week = result.week;
                    var songs = result.item;
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