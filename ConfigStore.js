var ConfigStore = function() {
    var config = require('./conf.json');
        
    return config;
};

module.exports = new ConfigStore();
