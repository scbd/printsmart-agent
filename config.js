var configPath = process.env.CONFIG_FILE || './config.json';

console.log("CONFIG PATH", configPath);

var config = require(configPath);
config.instanceId             = instanceId();
config.queues.print           = config.queues.print          .replace('{instanceId}', config.instanceId);
config.queues.reportJobStatus = config.queues.reportJobStatus.replace('{instanceId}', config.instanceId);
config.queues.updateJobStatus = config.queues.updateJobStatus.replace('{instanceId}', config.instanceId);

module.exports = exports = config;

//==============================
//
//==============================
function instanceId(){
    return require('os').hostname().replace(/[^a-z0-9]/i, '_');
}
