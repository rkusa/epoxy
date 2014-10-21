'use strict'

var Base = require('./base')

var BooleanAttribute = module.exports = function(node, locals, template, attr) {
  if (!template.isSingleExpression) {
    throw new Error('Only one single expression allowd for boolean attributes, '
                  + 'got: ' + template.source)
  }

  Base.apply(this, arguments)
  this.observe()

  this.attr = attr
  this.node.removeAttribute(attr.name)

  if (node.tagName === 'INPUT' && attr.name === 'checked') {
    var self = this
    node.addEventListener('change', function() {
      switch (node.type) {
        case 'checkbox':
          self.value = self.node[self.attr.name]
          break
        case 'radio':
          self.value = self.node.value
          break
      }
    })
  }
}

BooleanAttribute.prototype = Object.create(Base.prototype, {
  constructor: { value: BooleanAttribute }
})

BooleanAttribute.prototype.render = function() {
  if (this.node.tagName === 'INPUT' && this.node.type === 'radio' && this.attr.name === 'checked') {
    this.node[this.attr.name] = String(this.value) === this.node.value
  } else {
    this.node[this.attr.name] = this.value ? true : false
  }
}
