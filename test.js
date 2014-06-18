var when = require('when');
var agent = require('./agent');

var message = {
    id: '5395D9-E9915C46C8-72B4C9E2',
    url: 'http://www.cbd.int/doc/meetings/abs/absws-2014-06/other/absws-2014-06-info-note-en.pdf',
    symbol: 'UNEP/CBD/ABS/WS/2014/6/1',
    language: 'EN',
    name: 'John Smith - France',
    box: '0021',
    printerUri: 'ipp://localhost:631/printers/XRX0000AAF3421D'
}

when(agent.processMessage(message), function() {
    console.log('DONE');
});
