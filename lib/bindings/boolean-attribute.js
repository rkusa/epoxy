'use strict'

var Base = require('./base')

var BooleanAttribute = module.exports = function(node, locals, template, attr) {
  if (!template.isSingleExpression) {
    throw new Error('Only one single expression allowd for boolean attributes, '
                  + 'got: ' + this.template.source)
  }

  Base.apply(this, arguments)

  this.attr = attr
  this.node.removeAttribute(attr.name)

  if (node.tagName === 'INPUT' && attr.name === 'checked') {
    var self = this
    node.addEventListener('change', function() {
      self.value = self.node[self.attr.name]
    })
  }
}

BooleanAttribute.prototype = Object.create(Base.prototype, {
  constructor: { value: BooleanAttribute }
})

BooleanAttribute.prototype.render = function() {
  this.node[this.attr.name] = this.value ? true : false
}
