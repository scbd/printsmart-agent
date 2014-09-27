var AWS = require('aws-sdk');
var config = require('./config');
var when = require("when");
var nodefn = require("when/node/function");

function WorkerClass() {

    var self = this;

    var SQS = new AWS.SQS({
        accessKeyId: config.awsAccessKeys.global.accessKeyId,
        secretAccessKey: config.awsAccessKeys.global.secretAccessKey,
        region: 'us-east-1',
        apiVersion: '2012-11-05',
    });

	//============================================================
	//
	//
	//============================================================
	this.listen = function listen(queueUrl, callback) {

        console.log('info: pooling queue ' + queueUrl + '...');

        var options = {
            QueueUrl: queueUrl,
            MaxNumberOfMessages: 1,
            VisibilityTimeout: 90,
            WaitTimeSeconds: 20
        };

		var messages = nodefn.call(SQS.receiveMessage.bind(SQS), options).then(function succeeded (data) {

			return (data && data.Messages) ? data.Messages : [];
		});

		when.map(messages, function (message) {

			console.log('info: message received from queue ' + queueUrl);

			return when(callback(message), function succeeded () {

				return nodefn.call(SQS.deleteMessage.bind(SQS), { QueueUrl: options.QueueUrl, ReceiptHandle: message.ReceiptHandle });

			}).then(function onsuccess (data) {

				console.log('info: message successfully processed and removed from queue');

			}).otherwise(function onerror (error) {

				console.log('ERROR =>>');
				console.log(error);
			});

		}).otherwise(function onerror (error) {

            console.log('ERROR =>>');
            console.log(error);

            return promise.delay(10000);

        }).ensure(function () {

            setTimeout(function() { self.listen(queueUrl, callback); }, 1);
        });
	}
}

module.exports = exports = new WorkerClass();
