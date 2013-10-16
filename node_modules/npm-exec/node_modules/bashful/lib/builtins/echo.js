var resumer = require('resumer');

module.exports = function (args) {
    var tr = resumer();
    
    var opts = { newline: true, 'escape': false };
    for (var i = 0; i < args.length; i++) {
        if (args[i] === '-n') {
            opts.newline = false;
            args.splice(i--, 1);
        }
        else if (args[i] === '-e') {
            opts['escape'] = true;
            args.splice(i--, 1);
        }
        else if (args[i] === '-E') {
            opts['escape'] = false;
            args.splice(i--, 1);
        }
    }
    
    if (args.length) tr.queue(args.join(' '));
    if (opts.newline) tr.queue('\n');
    tr.queue(null);
    
    return tr;
};
