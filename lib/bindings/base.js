var GarbageCollector = require('../utils/garbage-collector')
var gc = new GarbageCollector

var Base = module.exports = function(node, locals, template) {
  this.node     = node
  this.locals   = locals
  this.template = template

  gc.register(node, this)
}

Base.prototype.render  = function() {}
Base.prototype.destroy = function() {}
Base.prototype.dispose = function() {
  this.destroy()
  this.node = this.locals = undefined
}
