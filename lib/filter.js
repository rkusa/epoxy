'use strict'

exports.filter = Object.create(null)

exports.registerFilter = function(name, fn) {
  exports.filter[name] = fn
}

exports.registerFilter('class', function(condition, name) {
  return condition ? name : ''
})
