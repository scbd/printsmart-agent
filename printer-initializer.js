'use strict';
var _        = require('lodash');
var co       = require('co');
var when     = require('when');
var processx = require('child_process');
var config   = require('./config');

module.exports = {
    init : init
};

if (require.main === module) //  called directly: node init-printers
    init();

//============================================================
//
//
//============================================================
function init() {
    return initPrinters().then(initClasses).catch(function(err){
        console.error(err);
        throw err;
    });
}

//============================================================
//
//
//============================================================
function initPrinters() {

    return when(co(function*(){

        var printers = config.printers||{};

        for(var name in printers) {

            let printer = printers[name];
            var params  = ['-p', name];

            if(printer.endpoint)    params = params.concat(['-v', printer.endpoint]);
            if(printer.driver)      params = params.concat(['-m', printer.driver]);
            if(printer.description) params = params.concat(['-D', printer.description]);
            if(printer.location)    params = params.concat(['-L', printer.location]);

            params.push('-E'); // enable printer;

            yield exec('lpadmin', params);
        }
    }));
}

//============================================================
//
//
//============================================================
function initClasses() {

    return when(co(function*(){

        var classes = config.classes||{};

        for(var name in classes) {

            let printers = classes[name];

            for(var i=0;i<printers.length;++i) {

                yield exec('lpadmin', '-p', printers[i], '-c', name);
            }

            yield exec('cupsenable', name);
            yield exec('cupsaccept', name);
        }
    }));
}

//============================================================
//
//
//============================================================
function exec(image) {

    var params = _.rest(_.flatten(arguments));

    return when.promise(function(resolve, reject) {

        console.log('$', image, params.join(' '));

        var ls = processx.spawn(image, params);

        ls.stdout.on('data', function (data) { console.log('stdout: ' + data); });
        ls.stderr.on('data', function (data) { console.log('stderr: ' + data); });

        ls.on('close', function (code) {

            if(!code) resolve();
            else      reject(code);
        });
    });
}
