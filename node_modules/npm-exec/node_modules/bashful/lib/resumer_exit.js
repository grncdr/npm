var through = require('through');
var nextTick = require('./next_tick.js');

module.exports = function (code) {
    var tr = through();
    tr.pause();
    nextTick(function () {
        tr.emit('exit', code);
        tr.queue(null);
        tr.resume();
    });
    return tr;
};
