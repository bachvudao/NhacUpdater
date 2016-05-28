var request = require('request');
var util = require('util');
var moment = require('moment');
var config = require('config.json')('./conf.json');

var chalk = require('chalk');
function logTime(){
    return chalk.magenta(moment().format('YYYY-MM-DD hh:mm:ss.SSS'));
}

function error(text) {
    return logTime() + " " + chalk.bold.red(text);
}
function info(text) {
    return logTime() + " " + chalk.white(text);
}
const highlight = chalk.bold.green;

var key = config.Zing.apiKey;
var url_format = 'http://api.mp3.zing.vn/api/mobile/charts/getchartsinfo?keycode=%s&requestdata={"week":%s,"id":%d,"year":%s,"start":0,"length":40}&fromvn=0';

var weekNumber = moment().format("W");
var year = moment().format("gggg");
var url = util.format(url_format, key, weekNumber, 1, year);

console.log(info('Getting latest songs for week ') + highlight('%s/%s.'), weekNumber, year);
console.log(info('Requesting ') + highlight('%s.'), url);

request(url, function(err, response, body) {
    if (!err && response.statusCode == 200) {
        var result = JSON.parse(body);
        var week = result.week;
        var songs = result.item;
        console.log(info("Received response: ") + highlight("%d songs."), result.item.length);
    } else {
        console.log(error("Error: %s. Response: %s. Body: %s"), err, util.inspect(response), util.inspect(body));
    }
});