var when = require('when');
var agent = require('./agent');
var jobs = require('./jobs');

// url: 'http://www.cbd.int/doc/meetings/bs/mop-07/official/mop-07-01-en.pdf',

var message = {
    //id: '5395D9-E9915C46C8-72B4C9E2',
    url: 'https://www.cbd.int/doc/meetings/tk/wg8j-09/insession/wg8j-09-l-03-zh.pdf',
    symbol: 'UNEP/CBD/ABS/WS/2014/6/1',
    language: 'EN',
    name: 'Stephane Bilodeau',
    government: 'Canada',
    tag: 'TEST',
    box: 'TEST',
    printerUri : process.argv[2]
};

when(agent.processMessage(message), showJobResult);

function showJobResult(job){

    return when(jobs.getStatus(job.printerUri, job.jobId)).then(function(jobAttr) {

        console.log(jobAttr['job-state']);

        if(jobAttr.isCompleted) {
            console.log("DONE!");
            process.exit(0);
        }

    }).catch(function(err){

        console.error(err);

    }).finally(function(){

        setTimeout(function() { showJobResult(job); }, 2500);

    });
}
