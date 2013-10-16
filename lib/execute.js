module.exports = execute

var path = require('path')
  , fs = require('fs')
  , log = require("npmlog")
  , shell = require('npm-exec')
  , npm = require('./npm')
  , readJson = require("read-package-json")


execute.usage = 'npm execute [--save <scriptname>] <command>'

function execute(args, cb) {
  if (!args.length) return cb(execute.usage)
  var pkgdir = process.cwd()

  while (!fs.existsSync(path.join(pkgdir, 'package.json'))) {
    pkgdir = pkgdir.split(path.sep);
    pkgdir.pop();
    if (!pkgdir.length) {
      console.error('No package.json found');
      process.exit(2);
    }
    pkgdir = '/' + path.join.apply(null, pkgdir);
  }

  readJson(path.join(pkgdir, 'package.json'), function (er, pkg) {
    if (er) throw er;
    var script = npm.argv.join(' ');
    // TODO set up buffers/pipe destinations for stdout/stderr
    var sh = shell(npm.config, pkg)
    var p = sh.eval(script)
    p.pipe(process.stdout)
    p.on('exit', function (code) {
      if (er && !npm.ROLLBACK) {
        log.info(pkg._id, "Failed to exec: "+script)
        er.message = pkg._id + " exec: `"
                   + script+"`\n"
                   + er.message
        if (er.code !== "EPERM") {
          er.code = "ELIFECYCLE"
        }
        er.pkgid = pkg._id
        er.script = script
        er.pkgname = pkg.name
        return cb(er)
      } else if (er) {
        log.error(pkg._id+" exec: "+script, er)
        log.error(pkg._id+" exec: "+script, "continuing anyway")
        return cb()
      }
      cb(er)
    })
  });
}
