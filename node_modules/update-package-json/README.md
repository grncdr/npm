# update-package-json

Simple way to to update `package.json` files exactly like `npm` does.

## API

### module.exports = function (filename, updateCallback, callback)

Reads and parses the JSON file at `filename`, then passes the data to
`updateCallback`. `updateCallback` should modify the data as it sees fit before
returning (it must be synchronous, this restriction may be relaxed in the
future). After `updateCallback` returns, the data will be serialized to JSON and
written back to `filename`.

If reading or parsing the file fails, `updateCallback` will not be called, and
`callback` will be called no arguments.

If writing the file fails, `callback` will be called with the error.

## License

BSD
