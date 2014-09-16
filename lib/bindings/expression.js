var Base   = require('./base')
var filter = require('../filter').filter

var Expression = module.exports = function() {
  Base.apply(this, arguments)
}

Expression.prototype = Object.create(Base.prototype, {
  constructor: { value: Expression }
})

Expression.prototype.render = function() {
  this.node.nodeValue = this.template.compile(this.locals, { filter: filter }).get() || ''
}

Expression.prototype.destroy = function() {
  Base.prototype.destroy.call(this)
  this.obj = undefined
}
