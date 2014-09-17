var ast    = require('../parser/ast')
var Base   = require('./base')
var filter = require('../filter').filter

var Attribute = module.exports = function(node, locals, template, attr) {
  Base.apply(this, arguments)

  this.attr = attr

  var isInputValue = node.tagName === 'INPUT' && attr.name === 'value'
  var isSingleExpr = template.body.length === 1 && template.body[0] instanceof ast.Expression
  if (isInputValue && isSingleExpr) {
    var reference = template.body[0].compile(this.locals, { filter: filter })
    node.addEventListener('change', function() {
      var value = reference.set(this.value)
      if (value !== this.value) {
        this.value = value
      }
    })
  } else if (isSingleExpr && !(attr.name in node)) {
    var reference = template.body[0].compile(this.locals, { filter: filter })
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
  this.attr.value = this.template.compile(this.locals, { filter: filter }).map(function(val) {
    val = val.valueOf()
    return val === undefined || typeof val === 'object' ? '' : val
  }).join('')
}
