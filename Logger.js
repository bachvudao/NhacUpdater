var Logger = function () {
    var chalk = require('chalk');
    var moment = require('moment');
    var util = require('util');

    var logTime = function() {
        return chalk.magenta(moment().format('YYYY-MM-DD hh:mm:ss.SSS'));
    }

    this.error = function() {
        arguments[0] = chalk.bold.red(arguments[0]);
        process.stdout.write(logTime() + " " + util.format.apply(null, arguments)  + "\n");
    }
    
    this.info = function() {
        process.stdout.write(logTime() + " " + util.format.apply(null, arguments) + "\n");
    }

    this.highlight = chalk.bold.green;
};

module.exports = new Logger();