process.on('SIGABRT', function() { console.log('Received SIGABRT. Exiting...'); process.exit(); });
process.on('SIGINT',  function() { console.log('Received SIGINT. Exiting...');  process.exit(); });
process.on('SIGTERM', function() { console.log('Received SIGTERM. Exiting...'); process.exit(); });

require("console-stamp")(console, "HH:MM:ss.l");
var when      = require('when');
var agent     = require('./agent');
var job       = require('./job');
var worker    = require('./worker');
var config    = require('./config');
var sqs       = require('./sqs');
var printerInitializer = require('./printer-initializer');

console.log('info: Starting PrintSmart Agent... (press ctrl-c to stop)');
console.log('info: ------------------------------------------------------------');

printerInitializer.init().then(function(){

    return when.all([
        sqs.assertQueue(config.queues.print,           { VisibilityTimeout: "90", MessageRetentionPeriod: "1209600" }),
        sqs.assertQueue(config.queues.reportJobStatus, { VisibilityTimeout: "90", MessageRetentionPeriod: "1209600" }),
        sqs.assertQueue(config.queues.updateJobStatus, { VisibilityTimeout: "90", MessageRetentionPeriod: "1209600", DelaySeconds : "20" }),
    ]);

}).then(function(){

    worker.listen(config.queues.print, function (message) {
        return agent.processMessage(JSON.parse(message.Body));
    });

    worker.listen(config.queues.updateJobStatus, function (message) {
        return job.updateJobStatus(JSON.parse(message.Body));
    });

}).catch(function(error){
    console.error(error);
    throw error;
});
