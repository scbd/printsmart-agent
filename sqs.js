var AWS = require('aws-sdk');
var config = require('./config');
var nodefn = require("when/node/function");

function Sqs() {

    var SQS = new AWS.SQS({
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
        region: 'us-east-1',
        apiVersion: '2012-11-05',
    });

    var sqs_getQueueUrl    = nodefn.lift(SQS.getQueueUrl   .bind(SQS));
    var sqs_createQueue    = nodefn.lift(SQS.createQueue   .bind(SQS));
    var sqs_receiveMessage = nodefn.lift(SQS.receiveMessage.bind(SQS));
    var sqs_deleteMessage  = nodefn.lift(SQS.deleteMessage .bind(SQS));
    var sqs_sendMessage    = nodefn.lift(SQS.sendMessage   .bind(SQS));

    //============================================================
    //
    //
    //============================================================
    this.assertQueue = function(queue, attributes) {

        return getQueueUrl(queue).then(function(queueUrl) {

            console.log(`Queue: ${queue} ready at ${queueUrl}`);

            return queueUrl;

        }).catch(function(err){

            if(err.code!='AWS.SimpleQueueService.NonExistentQueue')
                throw err;

            var options = { QueueName: queue };

            if(attributes)
                options.Attributes = attributes;

            console.log(`Creating queue: ${queue}`);

            return sqs_createQueue(options).then(function(data) {

                console.log(`Queue: ${queue} ready at ${data.QueueUrl}`);

                return data.QueueUrl;
            });
        });
    };

    //============================================================
    //
    //
    //============================================================
    this.receiveMessages = function(queue) {

        return getQueueUrl(queue).then(function(queueUrl){

            var options = {
                QueueUrl: queueUrl,
                MaxNumberOfMessages: 1,
                VisibilityTimeout: 90,
                WaitTimeSeconds: 20
            };

            return sqs_receiveMessage(options);

        }).then(function(data) {

            return (data && data.Messages) ? data.Messages : [];
        });
    };

    //============================================================
    //
    //
    //============================================================
    this.deleteMessage = function(queue, message) {

        return getQueueUrl(queue).then(function(queueUrl){

            var options = {
                QueueUrl: queueUrl,
                ReceiptHandle: message.ReceiptHandle
            };

            return sqs_deleteMessage(options);

        });
    };

    //============================================================
    //
    //
    //============================================================
    this.sendMessage = function(queue, message) {

        return getQueueUrl(queue).then(function(queueUrl){

            var options = {
                QueueUrl: queueUrl,
                MessageBody: JSON.stringify(message)
            };

            return sqs_sendMessage(options);
        });
    };

    //============================================================
    //
    //
    //============================================================
    function getQueueUrl(queue) {

        var options = { QueueName: queue,  QueueOwnerAWSAccountId: config.aws.accountId };

        return sqs_getQueueUrl(options).then(function(data) {
            return data.QueueUrl;
        });
    }
}

module.exports = exports = new Sqs();
