var bunyan = require('bunyan');
var config = require('./ConfigStore.js');

var logFactory = bunyan.createLogger({
  name : 'app',
  streams: [{
      level: 'info',
      stream: process.stdout
  },
  {
      level: 'info',
      type: 'rotating-file',
      path: config.logging.fileLocation,
      period: '1d',
      count: 10
  } ]
});

logFactory.info("Set up logging to file " + config.logging.fileLocation);

logFactory.info("Initialized logging");

var createLogger = function(name){
  return name ? logFactory.child({layer: name}) : logFactory;
}

module.exports = createLogger;
