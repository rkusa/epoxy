var Base = require('./base')

var Expression = module.exports = function() {
  Base.apply(this, arguments)
}

Expression.prototype = Object.create(Base.prototype, {
  constructor: { value: Expression }
})

Expression.prototype.render = function() {
  this.node.nodeValue = this.template.compile(this.locals)
}

Expression.prototype.destroy = function() {
  console.log('destroyied')
  Base.prototype.destroy.call(this)
  this.obj = undefined
}