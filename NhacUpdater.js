var request = require('request');
var util = require('util');
var moment = require('moment');
var configProvider = require('./NhacUpdaterConfig.js');
var connection = require('./DatabaseAccessor.js');
var logger = require('./Logger.js');

var config = configProvider.read();

var key = config.Zing.apiKey;
var url_format = 'http://api.mp3.zing.vn/api/mobile/charts/getchartsinfo?keycode=%s&requestdata={"week":%s,"id":%d,"year":%s,"start":0,"length":40}&fromvn=0';

var weekNumber = moment().format("W");
var year = moment().format("gggg");
var url = util.format(url_format, key, weekNumber, 1, year);

logger.info('Getting latest songs for week ' + logger.highlight('%s/%s.'), weekNumber, year);
logger.info('Requesting ' + logger.highlight('%s.'), url);

request(url, function(err, response, body) {
    if (!err && response.statusCode == 200) {
        var result = JSON.parse(body);
        var week = result.week;
        var songs = result.item;
        logger.info("Received response: " + logger.highlight("%d songs."), songs.length);

        connection.insert(songs);
        /*songs.forEach(function(element) {
            logger.info(songs);
        }, this);*/
    } else {
        logger.error("Error: %s. Response: %s. Body: %s", err, util.inspect(response), util.inspect(body));
    }
});