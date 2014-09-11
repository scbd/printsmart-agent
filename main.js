require("console-stamp")(console, "HH:mm:ss.l");
var agent  = require('./agent');
var job    = require('./job');
var worker = require('./worker');

console.log('info: Starting PaperSmart Agent... (press ctrl-c to stop)');
console.log('info: ------------------------------------------------------------');

worker.listen('https://sqs.us-east-1.amazonaws.com/264764397830/PrintSmart_print', function (message) {

    var message = JSON.parse(message.Body);

    return agent.processMessage(message);
});

worker.listen('https://sqs.us-east-1.amazonaws.com/264764397830/PrintSmart_updateJobStatus', function (message) {

    var message = JSON.parse(message.Body);

    return job.updateJobStatus(message);
});
