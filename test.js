var when = require('when');
var agent = require('./agent');

// url: 'http://www.cbd.int/doc/meetings/bs/mop-07/official/mop-07-01-en.pdf',

var message = {
    //id: '5395D9-E9915C46C8-72B4C9E2',
    url: 'https://www.cbd.int/doc/meetings/sbstta/sbstta-19/official/sbstta-19-01-add1-en.pdf',
    symbol: 'UNEP/CBD/ABS/WS/2014/6/1',
    language: 'EN',
    name: 'Stephane Bilodeau',
    government: 'Canada',
    tag: '!!!TEST!!!',
    box: 'TEST',
    printerUri : process.argv[2]
};



when(agent.processMessage(message), function() {
    console.log('DONE');
});
