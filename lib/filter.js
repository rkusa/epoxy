exports.filter = Object.create(null)

exports.registerFilter = function(name, fn) {
  exports.filter[name] = fn
}
