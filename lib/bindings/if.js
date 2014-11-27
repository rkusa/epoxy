'use strict'

var parser = require('../parser')
var Base   = require('./base')
var Repeat = require('./repeat')

var If = module.exports = function(node, locals, template) {
  if (!template) {
    template = parser.parse(node.getAttribute('if') || '')
  }

  if (!template.isEmpty && !template.isSingleExpression) {
    throw new Error('Only one single expression allowd for if templates, '
                  + 'got: ' + template.source)
  }

  Base.call(this, node, locals, template)
  this.observe()

  this.content = new Repeat(this.node, this.locals)
  this.isRendered = false
  this.oldValue   = null
}

If.prototype = Object.create(Base.prototype, {
  constructor: { value: If },
  condition: {
    enumerable: true,
    get: function() {
      var result = this.value
      return result && result !== 'false'
    }
  }
})

If.isIf = function(node) {
  return node.tagName === 'TEMPLATE' && node.hasAttribute('if')
}

If.prototype.render = function() {
  if (this.template.isEmpty) {
    this.content.render()
    return
  }

  var value = this.value
  if (this.condition) {
    if (this.isRendered && value === this.oldValue) {
      return
    }

    this.content.render()
    this.isRendered = true
  } else {
    if (!this.isRendered) {
      return
    }

    this.content.destroy()
    this.isRendered = false
  }

  this.oldValue = value
}
