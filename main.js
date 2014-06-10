var agent  = require('./agent');
var worker = require('./worker');

console.log('info: Starting PaperSmart Agent... (press ctrl-c to stop)');
console.log('info: ------------------------------------------------------------');

worker.listen('https://sqs.us-east-1.amazonaws.com/264764397830/PrintSmart_print', function (message) {

    var message = JSON.parse(message.Body);

    return agent.processMessage(message);
});
