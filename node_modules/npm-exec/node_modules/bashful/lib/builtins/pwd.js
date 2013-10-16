var resumerExit = require('../resumer_exit.js');

module.exports = function (args) {
    var tr = resumerExit(0);
    tr.queue(this.env.PWD + '\n');
    return tr;
};
