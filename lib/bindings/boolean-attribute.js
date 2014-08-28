var parser = require('../parser')
var Base   = require('./base')

var BooleanAttribute = module.exports = function(node, locals, template, attr) {
  Base.apply(this, arguments)

  this.attr = attr

  this.reference = this.template.compile(this.locals)
  if (node.tagName === 'INPUT' && attr.name === 'checked') {
    var self = this
    node.addEventListener('change', function() {
      self.reference.set(self.node[self.attr.name])
    })
  }
}

BooleanAttribute.prototype = Object.create(Base.prototype, {
  constructor: { value: BooleanAttribute }
})

BooleanAttribute.prototype.render = function() {
  this.node[this.attr.name] = this.reference.get() ? true : false
}