var when = require('when');
var agent = require('./agent');

// url: 'http://www.cbd.int/doc/meetings/bs/mop-07/official/mop-07-01-en.pdf',

var message = {
    id: '5395D9-E9915C46C8-72B4C9E2',
    url: 'http://www.cbd.int/doc/meetings/abs/absws-2014-06/other/absws-2014-06-info-note-en.pdf',
    symbol: 'UNEP/CBD/ABS/WS/2014/6/1',
    language: 'EN',
    name: 'Stephane Bilodeau',
    government: 'Bolivia (Plurinational State of)',
    tag: 'WG.1',
    box: '0021'
};

when(agent.processMessage(message), function() {
    console.log('DONE');
});
