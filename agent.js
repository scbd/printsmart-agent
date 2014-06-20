var AWS      = require('aws-sdk');
var path     = require('path');
var config   = require(path.join(process.env.HOME,'config.json'));
var fs       = require('fs');
var tmp      = require('tmp');
var processx = require('child_process');
var when     = require('when');
var nodefn   = require('when/node/function');
var es       = require('event-stream');
var request  = require('superagent');
var ipp      = require('ipp');
var diacritics = require('diacritics')
function AgentClass() {

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
    this.processMessage = function processMessage(message) {

        message.printerUri = 'ipp://localhost:631/printers/meeting-printer-2';

        var filenames = [ nodefn.call(tmp.tmpName, { postfix: '.pdf'       } ),
                          nodefn.call(tmp.tmpName, { postfix: '.ps'        } ),
                          nodefn.call(tmp.tmpName, { postfix: '.custom.ps' } ) ];

        return when.all(filenames).then(function (filenames) {

            return when(download(message.url, filenames[0])).then(function (filepath) {

                return convertToPS(filenames[0], filenames[1]);

            }).then(function () {

                return prepare(filenames[1], filenames[2], message);

            }).then(function () {

                return print(filenames[2], message);

            }).then(function (jobUri) {

                return nodefn.call(SQS.sendMessage.bind(SQS), {
                    QueueUrl: 'https://sqs.us-east-1.amazonaws.com/264764397830/PrintSmart_updateJobStatus',
                    MessageBody: JSON.stringify({ 'id': message.id, 'printerUri': message.printerUri, 'jobUri': jobUri })
                });

            }).then(function () {

                return when.map(filenames, function (filepath) { return nodefn.call(fs.unlink, filepath); } );
            });

        }).otherwise(function (err) {

            console.log('ERROR ==>');
            console.log(err);
        });
    }
}

module.exports = exports = new AgentClass();

//****************************************************************************************************
//****************************************************************************************************
//****************************************************************************************************
//****************************************************************************************************

//============================================================
//
//
//============================================================
function download(inputUrl, outputPath) {

    var deferred = when.defer();

    var req = request.get(inputUrl);

    var stream = fs.createWriteStream(outputPath);

    req.pipe(stream);

    stream.on('finish', function() {
        deferred.resolve(outputPath);
    });

    return deferred.promise;
}

//============================================================
//
//
//============================================================
function convertToPS(filePath, outputPath) {

    var deferred = when.defer();

    var ls = processx.spawn('pdftops', [filePath, outputPath]);

    ls.stdout.on('data', function (data) { console.log('stdout: ' + data); });
    ls.stderr.on('data', function (data) { console.log('stderr: ' + data); });

    ls.on('close', function (code) {

        if(code==0) deferred.resolve(outputPath);
        else        deferred.reject(code);
    });

    return deferred.promise;
}

//============================================================
//
//
//============================================================
function prepare(inputPath, outputPath, message) {

    var deferred = when.defer();
    var page = 0;

    var rStream = fs.createReadStream(inputPath, { encoding: 'utf8' });
    var wStream = fs.createWriteStream(outputPath);

    wStream.write('@PJL SET FINISH = LEFT1POINT\n', 'UTF-8');

    var transform = function (line) {

        if(line=='%%EndSetup') {

            line  = '%%BeginFeature: *Duplex NoTumble\n'
            line += '(<<) cvx exec /Duplex true /Tumble false (>>) cvx exec setpagedevice\n'
            line += '%%EndFeature\n'
            line += '%%BeginFeature: *Stapling Single-Portrait\n'
            line += '<< /Staple 3 /StapleDetails << /Type 1 /StapleLocation (SinglePortrait) >> >> setpagedevice\n'
            line += '%%EndFeature\n'
            line += '%%EndSetup'
        }

        if(line=='%%Page: 1 1') page = 1;
        if(line=='%%Page: 2 2') page = 2;

        if(line=='showpage' && page==1) {

            function escape (text) { return text.replace(/\\/, '\\\\').replace(/\(/, '\\(').replace(/\)/, '\\)'); }

            line  = 'newpath\n';
            line += '/Helvetica-Bold findfont 10 scalefont setfont\n';
            line += 'currentpagedevice /PageSize get aload pop exch pop 20 sub 200 exch moveto\n';
            line += '(SCBD PrintSmart - Copy printed ON-DEMAND) show\n';

            line += '/Helvetica findfont 7 scalefont setfont\n';
            line += 'currentpagedevice /PageSize get aload pop exch pop 34 sub 200 exch moveto\n'
            line += '(Copy ID: '+escape(message.id)+') show\n';

            line += '/Helvetica findfont 7 scalefont setfont\n';
            line += 'currentpagedevice /PageSize get aload pop exch pop 44 sub 200 exch moveto\n'
            line += '(File: '+escape(message.url)+') show\n';

            line += '/Helvetica-Bold findfont 12 scalefont setfont\n';
            line += 'currentpagedevice /PageSize get aload pop exch pop 58 sub 200 exch moveto\n'
            line += '('+escape(diacritics.remove(message.name||"Not Named"))+') show\n';

            line += '/Helvetica-Bold findfont 24 scalefont setfont\n';
            line += 'currentpagedevice /PageSize get aload pop exch pop 30 sub 440 exch moveto\n';
            line += '('+escape(diacritics.remove(message.box||"undefined"))+') true charpath 1 setlinewidth 0.0 setgray stroke\n';

            line += 'showpage';
        }

        return line + '\n';
    };

    rStream.pipe(es.split())
           .pipe(es.mapSync(transform))
           .pipe(es.wait())
           .pipe(wStream);

    wStream.on('finish', function () {
        deferred.resolve(outputPath);
    });

    return deferred.promise;
}

//============================================================
//
//
//============================================================
function print(filename, message) {

    var printer = ipp.Printer(message.printerUri);

    var title = message.box + ': ' + message.symbol + ' (' + message.language + ') - ' + message.name;

    var options = {
        'operation-attributes-tag': {
            'job-name': title,
            'requesting-user-name': 'PrintSmart',
            'document-format': 'application/postscript'
        },
        "job-attributes-tag": {
            'sides': 'two-sided-long-edge',
            'finishings': 'staple'
        },
        data: fs.readFileSync(filename)
    };

    return when(nodefn.call(printer.execute.bind(printer), "Print-Job", options), function (res) {
        console.log("Print-Job", res);
        return res['job-attributes-tag']['job-uri'];
    });
}
