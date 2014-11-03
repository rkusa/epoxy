'use strict'

var Base = require('./base')

var Attribute = module.exports = function(node, locals, template, attr) {
  Base.apply(this, arguments)
  this.observe()

  this.attr = attr

  if (!this.template.isSingleExpression) {
    this.render()
    return this
  }

  if (!(attr.name in node)) {
    var reference = this.contents[0]
    var getter = function() { return reference.get() }
    getter.parent = reference.obj
    getter.key    = reference.key
    getter.alias  = reference.alias
    Object.defineProperty(node, attr.name, {
      get: getter,
      set: function(val) { reference.set(val) },
      enumerable: true
    })
  }
}

Attribute.prototype = Object.create(Base.prototype, {
  constructor: { value: Attribute }
})

Attribute.prototype.render = function() {
  var value = this.value ? String(this.value) : ''
  if (value === '[object Object]') {
    value = ''
  }

  this.attr.value = value || ''
}
