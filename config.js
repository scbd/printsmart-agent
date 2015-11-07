var fs = require('fs');
var path = require('path');

var config = null;

if(!config && fs.existsSync(path.join(process.cwd(), 'config.json')))
    config = require(path.join(process.cwd(), 'config.json'));

if(!config && fs.existsSync(path.join(process.env.HOME, 'config.json')))
    config = require(path.join(process.env.HOME, 'config.json'));

if(!config)
    throw "Config.json not found";

module.exports = exports = config;
