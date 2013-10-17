module.exports = execute

var path = require("path")
  , fs = require("fs")
  , log = require("npmlog")
  , shell = require('npm-exec')
  , npm = require("./npm")
  , updateJson = require("update-package-json")
  , readJson = require("read-package-json")


execute.usage = 'npm execute [--save <scriptname>] <command>'

function execute(args, cb) {
  if (!args.length) return cb(execute.usage)
  var saveAs = npm.config.get('save') && args.shift()
  var pkgdir = path.resolve(npm.dir, "..")

  readJson(path.join(pkgdir, 'package.json'), function (er, pkg) {
    if (er) return cb(er)
    var script = args.join(' ')
      , sh = shell(npm.config, pkg)
      , erred = false
      , p = sh.eval(script)

    p.pipe(process.stdout)

    p.on('error', onError)

    p.on('exit', function (code) {
      if (erred) return;
      if (code) onError(new Error(script + " exited with code " + code))
      else if (saveAs) saveScript(pkgdir, saveAs, script, cb)
      else cb()
    })

    function onError (er) {
      if (erred) return;
      erred = true;
      if (er && !npm.ROLLBACK) {
        log.info(pkg._id, "Failed to exec: "+script)
        er.message = pkg._id + " exec: `"
                   + script+"`\n"
                   + er.message
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
    }
  })
}

function saveScript(pkgdir, scriptName, script, cb) {
  updateJson(path.join(pkgdir, 'package.json'), function (data) {
    data.scripts = data.scripts || {}
    data.scripts[scriptName] = script
  }, cb)
}

