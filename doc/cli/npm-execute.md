npm-exec(1) -- Run and save arbitrary command lines
===================================================

## SYNOPSIS

    npm exec [--save <name> --] <script>

## DESCRIPTION

This runs arbitrary commands within the same environment used for
scripts in the "scripts" member of package.json.

It is used by the run-script command (which is in turn used by the
test, start, restart, and stop commands) but can be called directly
as well.

Additionally, if you find a particular command useful enough to run
multiple times, you can save it in your package json using the --save
option. For example, if you were to run:

    npm exec --save test -- mocha --compilers coffee:coffee-script

Then subsequent invocations of `npm test` would run the same command.

## SEE ALSO

* npm-scripts(1)
* npm-run-script(1)
