var fs       = require('fs');
var tmp      = require('tmp');
var processx = require('child_process');
var when     = require('when');
var nodefn   = require('when/node/function');
var es       = require('event-stream');
var request  = require('superagent');

var message = {
    id: '5395D9-E9915C46C8-72B4C9E2',
    url: 'http://www.cbd.int/doc/meetings/abs/absws-2014-06/other/absws-2014-06-info-note-en.pdf',
    symbol: 'UNEP/CBD/ABS/WS/2014/6/1',
    language: 'EN',
    name: 'John Smith - France',
    box: '0021'
}

processMessage(message);

//============================================================
//
//
//============================================================
function processMessage(message) {

    var filenames = [ nodefn.call(tmp.tmpName, { postfix: '.pdf'       } ),
                      nodefn.call(tmp.tmpName, { postfix: '.ps'        } ),
                      nodefn.call(tmp.tmpName, { postfix: '.custom.ps' } ) ];

    return when.all(filenames).then(function (filenames) {

        return when(download(message.url, filenames[0])).then(function (filepath) {

            return convertToPS(filenames[0], filenames[1]);

        }).then(function () {

            return prepare(filenames[1], filenames[2], message);

        }).then(function () {

            return print(filenames[2]);

        }).then(function () {

            return when.map(filenames, function (filepath) { return nodefn.call(fs.unlink, filepath); } );
        });

    }).otherwise(function (err) {

        console.log('ERROR ==>');
        console.log(err);
    });
}

//********************************************************************************
//********************************************************************************
//********************************************************************************
//********************************************************************************

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

    var rStream = fs.createReadStream(inputPath, { encoding: 'utf8' });
    var wStream = fs.createWriteStream(outputPath);

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

        if(line=='%%Page: 1 1') {

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

            line += '/Helvetica-Bold findfont 8 scalefont setfont\n';
            line += 'currentpagedevice /PageSize get aload pop exch pop 58 sub 200 exch moveto\n'
            line += '('+escape(message.name)+') show\n';

            line += '/Helvetica-Bold findfont 24 scalefont setfont\n';
            line += 'currentpagedevice /PageSize get aload pop exch pop 30 sub 440 exch moveto\n';
            line += '('+escape(message.box)+') true charpath 1 setlinewidth 0.0 setgray stroke\n';
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
function print(filepath) {

    var deferred = when.defer();

    var title = message.box + ': ' + message.symbol + ' (' + message.language + ') - ' + message.name;

    var ls = processx.spawn('lp', ['-o raw', filepath, '-t', title]);

    ls.stdout.on('data', function (data) { console.log('stdout: ' + data); });
    ls.stderr.on('data', function (data) { console.log('stderr: ' + data); });

    ls.on('close', function (code) {

        if(code==0) deferred.resolve(code);
        else        deferred.reject(code);
    });

    return deferred.promise;
}
