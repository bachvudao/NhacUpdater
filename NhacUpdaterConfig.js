var NhacUpdaterConfig = function() {
    var configReader = require('config.json');
    var config;

    this.read = function() {
        if (!config) {
            config = configReader(('./conf.json'));
        }

        return config;
    }
};

module.exports = new NhacUpdaterConfig();
