"use strict";

const ConfigStore = function() {
    const config = require('./conf.json');
        
    return config;
};

module.exports = new ConfigStore();
