var NhacUpdaterConfig = function(){
    var logger = require('./Logger.js');
    var configReader = require('config.json');
    var config;

    this.read = function(){
        if(!config){
            logger.info("Reading config");
            config = configReader(('./conf.json'));
        }
        
        return config;
    }
};

module.exports = new NhacUpdaterConfig();