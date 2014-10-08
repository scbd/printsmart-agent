require("console-stamp")(console, "HH:MM:ss.l");
var agent     = require('./agent');
var job       = require('./job');
var worker    = require('./worker');
var config    = require('./config');

console.log('info: Starting PaperSmart Agent... (press ctrl-c to stop)');
console.log('info: ------------------------------------------------------------');

worker.listen(config.printsmart.awsQueues.print, function (message) {

    return agent.processMessage(JSON.parse(message.Body));
});

worker.listen(config.printsmart.awsQueues.updateJobStatus, function (message) {

    return job.updateJobStatus(JSON.parse(message.Body));
});
