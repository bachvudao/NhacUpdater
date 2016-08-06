var winston = require('winston');
var moment = require('moment');

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, 
    {
      timestamp: function(){
        return moment().format("YYYY-MM-DD HH:mm:ss.SSS"); 
      },
      colorize: true,
      formatter: function(options){
                  return options.timestamp() + ' ' + options.level.toUpperCase() + ': ' + (options.message == undefined ? ' ' : options.message);
                          },
      level: 'info'
    });

winston.add(winston.transports.File, 
    {
      level: 'info',
      filename: './logs/NhacUpdater.log',
      maxSize: 52428800, // 50 mb
      maxFiles: 10
    });

winston.info("Initialized logging");

module.exports = winston;
