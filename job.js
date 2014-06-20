var AWS    = require('aws-sdk');
var path   = require('path');
var config = require(path.join(process.env.HOME,'config.json'));
var when   = require("when");
var nodefn = require("when/node/function");
var ipp    = require('ipp');

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

        var printer = ipp.Printer(message.printerUri);

        var options = { 'operation-attributes-tag': { 'job-uri': message.jobUri } };

        return when(nodefn.call(printer.execute.bind(printer), "Get-Job-Attributes", options), function (res) {

            var tasks  = [];
            var report = { id: message.id, printerUri: message.printerUri, jobUri: message.jobUri, status: res['job-attributes-tag'] };

            console.log('Updating job %s (%s) status...', message.id, message.jobUri);

            tasks.push(nodefn.call(SQS.sendMessage.bind(SQS), {
                QueueUrl: 'https://sqs.us-east-1.amazonaws.com/264764397830/PrintSmart_jobStatusReport',
                MessageBody: JSON.stringify(report)
            }));

            var needRefresh = report.status['job-state']=='pending'      ||
                              report.status['job-state']=='pending-held' ||
                              report.status['job-state']=='processing'   ||
                              report.status['job-state']=='processing-stopped';

            if(needRefresh) {

                console.log('Job %s (%s), is still pending; check again in 20 seconds.', message.id, report.status['job-id']);

                tasks.push(nodefn.call(SQS.sendMessage.bind(SQS), {
                    QueueUrl: 'https://sqs.us-east-1.amazonaws.com/264764397830/PrintSmart_updateJobStatus',
                    MessageBody: JSON.stringify(message)
                }));
            }

            return when.all(tasks);
        });
    };
}

module.exports = exports = new JobClass();
