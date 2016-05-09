var sqs    = require('./sqs');
var config = require('./config');
var when   = require("when");
var nodefn = require("when/node/function");
var ipp    = require('ipp');

function JobClass() {

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

            tasks.push(sqs.sendMessage(config.queues.reportJobStatus, report));

            var needRefresh = report.status['job-state']=='pending'      ||
                              report.status['job-state']=='pending-held' ||
                              report.status['job-state']=='processing'   ||
                              report.status['job-state']=='processing-stopped';

            if(needRefresh) {

                console.log('Job %s (%s), is still pending; check again in 20 seconds.', message.id, report.status['job-id']);

                tasks.push(sqs.sendMessage(config.queues.updateJobStatus, message));
            }

            return when.all(tasks);
        });
    };
}

module.exports = exports = new JobClass();
