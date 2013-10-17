module.exports = update

var fs = require('fs');

// Encapsulate the read/parse/write bits of subcommands that update package.json
// the updateCb should be sync, update the package data in place, and won't be
// called if reading the package.json fails
function update(filename, updateCb, cb) {
  fs.readFile(filename, function (er, data) {
    // ignore errors here, just don't save it.
    try {
      data = JSON.parse(data.toString("utf8"))
    } catch (ex) {
      er = ex
    }

    if (er) {
      return cb()
    }

    updateCb(data);
    data = JSON.stringify(data, null, 2) + "\n"
    fs.writeFile(filename, data, cb)
  })
}
