#!/usr/bin/env node
var bash = require('../');
var fork = require('pty.js/build/Release/pty.node').fork;
var clone = require('clone');
var duplexer = require('duplexer');
var ReadStream = require('tty').ReadStream;
var WriteStream = require('tty').WriteStream;
var fs = require('fs');

var sh = bash({
    env: process.env,
    spawn: function (cmd, args, opts) {
        var env = Object.keys(opts.env).map(function (key) {
            return key + '=' + opts.env[key];
        });
        var ps = fork(
            cmd, args, env, opts.cwd,
            process.stdout.columns, process.stdout.rows
        );
        var rs = new ReadStream(ps.fd);
        rs.on('error', function () { rs.emit('end') });
        return rs;
    },
    write: fs.createWriteStream,
    read: fs.createReadStream,
    exists: fs.exists
});

var s = sh.createStream();
process.stdin.pipe(s).pipe(process.stdout);
