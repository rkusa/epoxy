var ast    = require('../parser/ast')
var Base   = require('./base')
var filter = require('../filter').filter

var Attribute = module.exports = function(node, locals, template, attr) {
  Base.apply(this, arguments)

  this.attr = attr

  var isSingleExpr = template.body.length === 1 && template.body[0] instanceof ast.Expression
  if (!isSingleExpr) {
    return this
  }

  var reference = template.body[0].compile(this.locals, { filter: filter })

  if (node.tagName === 'INPUT' && attr.name === 'value') {
    node.addEventListener('change', function() {
      var value = reference.set(this.value)
      if (value !== this.value) {
        this.value = value
      }
    })
  } else if (node.tagName === 'SELECT' && attr.name === 'value') {
    node.addEventListener('change', function() {
      var value = reference.set(this.value)
      if (value !== this.value) {
        this.value = value
      }
    })
    node.removeAttribute(attr.name)
  } else if (!(attr.name in node)) {
    var getter = function() { return reference.get() }
    getter.parent = reference.obj
    getter.key    = reference.key
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
  var value = this.template.compile(this.locals, { filter: filter }).map(function(val) {
    val = val.valueOf()
    return val === undefined || typeof val === 'object' ? '' : val
  }).join('')

  if (this.node.tagName === 'SELECT' && this.attr.name === 'value') {
    if (!value) return
    var option = this.node.querySelector('option[value=' + value + ']')
    if (option) {
      option.selected = true
    }
  } else {
    this.attr.value = value
  }
}
