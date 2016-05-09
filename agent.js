var sqs      = require('./sqs');
var config   = require('./config');
var fs       = require('fs');
var tmp      = require('tmp');
var processx = require('child_process');
var when     = require('when');
var nodefn   = require('when/node/function');
var es       = require('event-stream');
var request  = require('superagent');
var ipp      = require('ipp');
var _        = require('lodash');
var diacritics = require('diacritics');

function AgentClass() {

    //============================================================
    //
    //
    //============================================================
    function selectQueue(message)
    {
        var box = normalize(message.box); //jshint ignore:line

        if(message.anonymous) // For printshop
            return 'ipp://localhost:631/classes/printshop';

        return 'ipp://localhost:631/classes/default';
    }

    //============================================================
    //
    //
    //============================================================
    this.processMessage = function processMessage(message) {

        message = JSON.parse(JSON.stringify(message));//fullclone object;

        message.printerUri = message.printerUri || selectQueue(message);

        console.log('Processing:', message);

        var filenames = [ nodefn.call(tmp.tmpName, { postfix: '.pdf'       } ),
                          nodefn.call(tmp.tmpName, { postfix: '.ps'        } ),
                          nodefn.call(tmp.tmpName, { postfix: '.custom.ps' } ) ];

        return when.all(filenames).then(function (filenames) {

            return when(download(message.url, filenames[0])).then(function () {

                return convertToPS(filenames[0], filenames[1]);

            }).then(function () {

                return prepare(filenames[1], filenames[2], message);

            }).then(function () {

                return print(filenames[2], message);

            }).then(function (jobUri) {

                if(!message.id)
                    return;

                return sqs.sendMessage(config.queues.updateJobStatus, { 'id': message.id, 'printerUri': message.printerUri, 'jobUri': jobUri });

            }).then(function () {

                return when.map(filenames, function (filepath) { return nodefn.call(fs.unlink, filepath); } );
            });

        });
    };
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

    var params = [];

    if(config.postscript) {
        if(config.postscript.level) params = params.concat([`-level${config.postscript.level}`]);
        if(config.postscript.paper) params = params.concat([`-paper`,config.postscript.paper]);
    }

    console.log(params);

    var ls = processx.spawn('pdftops', params.concat([filePath, outputPath]));

    ls.stdout.on('data', function (data) { console.log('stdout: ' + data); });
    ls.stderr.on('data', function (data) { console.log('stderr: ' + data); });

    ls.on('close', function (code) {

        if(code==0) deferred.resolve(outputPath); //jshint ignore:line
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

        // if(line=='%%EndSetup') {
        //
        //     line  = '%%BeginFeature: *Duplex NoTumble\n';
        //     line += '(<<) cvx exec /Duplex true /Tumble false (>>) cvx exec setpagedevice\n';
        //     line += '%%EndFeature\n';
        //     line += '%%BeginFeature: *Stapling Single-Portrait\n';
        //     line += '<< /Staple 3 /StapleDetails << /Type 1 /StapleLocation (SinglePortrait) >> >> setpagedevice\n';
        //     line += '%%EndFeature\n';
        //     line += '%%EndSetup';
        // }

        if(line=='%%Page: 1 1') page = 1;
        if(line=='%%Page: 2 2') page = 2;

        if(!message.anonymous && line=='showpage' && page==1) {

            line  = 'newpath\n';

            // TOP OF PAGE

            // NAME
            line += '/Helvetica-Bold findfont 12 scalefont setfont\n';
            line += 'currentpagedevice /PageSize get aload pop exch pop 22 sub 190 exch moveto\n';
            line += '('+escape(diacritics.remove(message.name||"Not Named"))+') show\n';

            // COUNTRY

            if(message.government) {
                line += '/Helvetica-Bold findfont 10 scalefont setfont\n';
                line += 'currentpagedevice /PageSize get aload pop exch pop 36 sub 190 exch moveto\n';
                line += '('+escape(diacritics.remove(message.government))+') show\n';
            }

            line += '/Helvetica findfont 7 scalefont setfont\n';
            line += 'currentpagedevice /PageSize get aload pop exch pop 48 sub 190 exch moveto\n';
            line += '(SCBD PrintSmart - Copy printed ON-DEMAND) show\n';

            // TOP LEFT

            var box = [message.box, initials(message.name||"")].join(' - ');

            line += '/Helvetica-Bold findfont 24 scalefont setfont\n';
            line += 'currentpagedevice /PageSize get aload pop exch pop 30 sub 40 exch moveto\n';
            line += '('+escape(diacritics.remove(box||"NOT-SET"))+') show\n';

            // TOP RIGHT

            var tag = diacritics.remove(message.tag||"");

            if(message.tag) {
                line += '/Helvetica-Bold findfont 24 scalefont setfont\n';
                line += 'currentpagedevice /PageSize get aload pop exch pop 30 sub 472 exch moveto\n';
                line += '('+escape(diacritics.remove(tag))+') true charpath 1 setlinewidth 0.0 setgray stroke\n';
            }

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
//
//============================================================
function escape (text) {
    return text.replace(/\\/, '\\\\')
               .replace(/\(/, '\\(')
               .replace(/\)/, '\\)');
}

//============================================================
//
//
//
//============================================================
function initials (name) {

    var names = (name||"").toString().toLocaleUpperCase().split(' ');

    return _.chain(names).map(function(n){
        return (n||"").replace(/[^A-Z\s]+/gi, '').charAt(0);
    }).compact().value().join('');
}

//============================================================
//
//
//
//============================================================
function normalize (text) {

    text = (text||"").toString();

    while(text.length<4)
        text = '0'+text;

    return text;
}

//============================================================
//
//
//============================================================
function print(filename, message) {

    var printer = ipp.Printer(message.printerUri);

    var title  = message.box + ': ' + message.symbol + ' (' + message.language + ') - ' + message.name;
    var copies = Math.round(message.copies || 1);

    var options = {
        'operation-attributes-tag': {
            'job-name': title,
            'requesting-user-name': 'PrintSmart',
            'document-format': 'application/postscript'
        },
        "job-attributes-tag": {
            'sides': 'two-sided-long-edge',
            'finishings': ['staple'],
            'copies' : copies
        },
        data: fs.readFileSync(filename)
    };

    if(options['job-attributes-tag'].copies)
        console.log("Copies: ", copies);

    return when(nodefn.call(printer.execute.bind(printer), "Print-Job", options), function (res) {
        return res['job-attributes-tag']['job-uri'];
    });
}
