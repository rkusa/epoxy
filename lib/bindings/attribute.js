var parser = require('../parser')
var ast    = require('../parser/ast')
var Base   = require('./base')

var Attribute = module.exports = function(node, locals, template, attr) {
  Base.apply(this, arguments)

  this.attr = attr

  var isInputValue = node.tagName === 'INPUT' && attr.name === 'value'
  var isSingleExpr = template.body.length === 1 && template.body[0] instanceof ast.Expression
  if (isInputValue && isSingleExpr) {
    var reference = template.body[0].compile(this.locals)
    node.addEventListener('change', function() {
      reference.set(this.value)
    })
  }
}

Attribute.prototype = Object.create(Base.prototype, {
  constructor: { value: Attribute }
})

Attribute.prototype.render = function() {
  this.attr.value = this.template.compile(this.locals).join('')
}