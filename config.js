console.log(process.env.INSTANCE_ID);
console.log(process.env.CONFIG_FILE);

if(!process.env.CONFIG_FILE) throw new Error("Environment variable CONFIG_FILE not set");
if(!process.env.INSTANCE_ID) throw new Error("Environment variable INSTANCE_ID not set");

var config = require(process.env.CONFIG_FILE);

config.instanceId             = process.env.INSTANCE_ID.replace(/[^a-z0-9]/i, '_');
config.queues.print           = config.queues.print          .replace('{instanceId}', config.instanceId);
config.queues.reportJobStatus = config.queues.reportJobStatus.replace('{instanceId}', config.instanceId);
config.queues.updateJobStatus = config.queues.updateJobStatus.replace('{instanceId}', config.instanceId);

module.exports = exports = config;
