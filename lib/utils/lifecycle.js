exports = module.exports = lifecycle
exports.cmd = cmd

var log = require("npmlog")
  , spawn = require("child_process").spawn
  , npm = require("../npm.js")
  , path = require("path")
  , fs = require("graceful-fs")
  , chain = require("slide").chain
  , constants = require("constants")
  , Stream = require("stream").Stream
  , shell = require('npm-exec')

function lifecycle (pkg, stage, wd, unsafe, failOk, cb) {
  if (typeof cb !== "function") cb = failOk, failOk = false
  if (typeof cb !== "function") cb = unsafe, unsafe = false
  if (typeof cb !== "function") cb = wd, wd = null

  while (pkg && pkg._data) pkg = pkg._data
  if (!pkg) return cb(new Error("Invalid package data"))

  log.info(stage, pkg._id)
  if (!pkg.scripts) pkg.scripts = {}

  validWd(wd || path.resolve(npm.dir, pkg.name), function (er, wd) {
    if (er) return cb(er)

    unsafe = unsafe || npm.config.get("unsafe-perm")

    if ((wd.indexOf(npm.dir) !== 0 || path.basename(wd) !== pkg.name)
        && !unsafe && pkg.scripts[stage]) {
      log.warn( "cannot run in wd", "%s %s (wd=%s)"
              , pkg._id, pkg.scripts[stage], wd)
      return cb()
    }

    var env = {
      PWD: wd,
      NODE: process.env.NODE || process.execPath,
      npm_lifecycle_event: stage,
      npm_execpath: require.main.filename
    }
    env.npm_node_execpath = env.NODE

    // "nobody" typically doesn't have permission to write to /tmp
    // even if it's never used, sh freaks out.
    if (!npm.config.get("unsafe-perm")) env.TMPDIR = wd

    var packageLifecycle = pkg.scripts && pkg.scripts.hasOwnProperty(stage)

    if (packageLifecycle) {
      // define this here so it's available to all scripts.
      env.npm_lifecycle_script = pkg.scripts[stage]
    }

    if (failOk) {
      cb = (function (cb_) { return function (er) {
        if (er) log.warn("continuing anyway", er.message)
        cb_()
      }})(cb)
    }

    if (npm.config.get("force")) {
      cb = (function (cb_) { return function (er) {
        if (er) log.info("forced, continuing", er)
        cb_()
      }})(cb)
    }

    chain
      ( [ packageLifecycle && [runPackageLifecycle, pkg, env, wd, unsafe]
        , [runHookLifecycle, pkg, env, wd, unsafe] ]
      , cb )
    })
}

function checkForLink (pkg, cb) {
  var f = path.join(npm.dir, pkg.name)
  fs.lstat(f, function (er, s) {
    cb(null, !(er || !s.isSymbolicLink()))
  })
}

function validWd (d, cb) {
  fs.stat(d, function (er, st) {
    if (er || !st.isDirectory()) {
      var p = path.dirname(d)
      if (p === d) {
        return cb(new Error("Could not find suitable wd"))
      }
      return validWd(p, cb)
    }
    return cb(null, d)
  })
}

function runPackageLifecycle (pkg, env, wd, unsafe, cb) {
  // run package lifecycle scripts in the package root, or the nearest parent.
  var stage = env.npm_lifecycle_event
    , cmd = env.npm_lifecycle_script
    , sh = shell(npm.config, pkg, {env: env})

  log.verbose("unsafe-perm in lifecycle", unsafe)

  var note = "\n> " + pkg._id + " " + stage + " " + wd
           + "\n> " + cmd + "\n"

  console.log(note)

  npm.commands.execute(env, [cmd], function (er) {
    if (er && !npm.ROLLBACK) {
      log.info(pkg._id, "Failed to exec "+stage+" script")
      er.message = pkg._id + " "
                 + stage + ": `" + env.npm_lifecycle_script+"`\n"
                 + er.message
      if (er.code !== "EPERM") {
        er.code = "ELIFECYCLE"
      }
      er.pkgid = pkg._id
      er.stage = stage
      er.script = env.npm_lifecycle_script
      er.pkgname = pkg.name
      return cb(er)
    } else if (er) {
      log.error(pkg._id+"."+stage, er)
      log.error(pkg._id+"."+stage, "continuing anyway")
    }
    cb(er)
  })
}

function runHookLifecycle (pkg, env, wd, unsafe, cb) {
  // check for a hook script, run if present.
  var stage = env.npm_lifecycle_event
    , hook = path.join(npm.dir, ".hooks", stage)
    , cmd = hook

  fs.stat(hook, function (er) {
    if (er) return cb()

    npm.commands.execute(env, [cmd], function (er) {
      if (er) {
        er.message += "\nFailed to exec "+stage+" hook script"
        log.info(pkg._id, er)
      }
      if (npm.ROLLBACK) return cb()
      cb(er)
    })
  })
}

function cmd (stage) {
  function CMD (args, cb) {
    if (args.length) {
      chain(args.map(function (p) {
        return [npm.commands, "run-script", [p, stage]]
      }), cb)
    } else npm.commands["run-script"]([stage], cb)
  }
  CMD.usage = "npm "+stage+" <name>"
  var installedShallow = require("./completion/installed-shallow.js")
  CMD.completion = function (opts, cb) {
    installedShallow(opts, function (d) {
      return d.scripts && d.scripts[stage]
    }, cb)
  }
  return CMD
}
