var AWS = require('aws-sdk');
var path = require('path');
var crypto = require('crypto');
var config = require(path.join(process.env.HOME,'config.json'));
var when = require("when");
var nodefn = require("when/node/function");
var ipp = require('ipp');

var printer = ipp.Printer("ipp://localhost:631/printers/XEROX");

function JobClass() {

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
    this.updateJobStatus = function updateJobStatus (message) {

        var options = { 'operation-attributes-tag': { 'job-uri': message['job-uri'] } };

        return when(nodefn.call(printer.execute.bind(printer), "Get-Job-Attributes", options), function (res) {

            var tasks  = [];
            var status = res['job-attributes-tag'];

            console.log('Updating job %s status... (sending report)', status['job-id']);

            tasks.push(nodefn.call(SQS.sendMessage.bind(SQS), {
                QueueUrl: 'https://sqs.us-east-1.amazonaws.com/264764397830/PrintSmart_jobStatusReport',
                MessageBody: JSON.stringify(status)
            }));

            if(status['job-state']=='pending') {

                console.log('Job %s is still pending; check again in 20 seconds.', status['job-id']);

                tasks.push(nodefn.call(SQS.sendMessage.bind(SQS), {
                    QueueUrl: 'https://sqs.us-east-1.amazonaws.com/264764397830/PrintSmart_updateJobStatus',
                    MessageBody: JSON.stringify( { 'job-uri': status['job-uri'] })
                }));
            }

            return when.all(tasks);
        });
    };
}

module.exports = exports = new JobClass();
