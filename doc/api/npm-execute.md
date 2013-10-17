npm-execute(3) -- Run arbitrary command lines
=============================================

## SYNOPSIS

    npm.commands.execute([env,] args, callback)

## DESCRIPTION

This runs an arbitrary command line in an environment containing
the current package and npm configuration. This supports standard
POSIX chaining and redirection operators ('&&', '||', '<', and '>')
via the bashful library.

It is used by the various lifecycle scripts (test, start, restart,
and stop) as well as run-script, but can also be called directly.

The optional 'env' parameter should be an object whose key-value
pairs will be added the execution environment of the command line,
this is used by lifecycle commands to set the working directory and
other lifecycle environment variables.

The 'args' parameter is an array of strings that will be joined with
a single space and parsed/executed by bashful.

## SEE ALSO

* npm-scripts(7)
* npm-run-script(3)
