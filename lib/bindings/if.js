var parser = require('../parser')
var Base   = require('./base')
var Repeat = require('./repeat')

var If = module.exports = function() {
  Base.apply(this, arguments)

  var ifAttr = this.node.getAttribute('if')
  this.condition = ifAttr ? parser.parse(ifAttr) : null
  this.content = new Repeat(this.node, this.locals, this.template)
}

If.prototype = Object.create(Base.prototype, {
  constructor: { value: If }
})

If.prototype.render = function() {
  if (!this.condition || this.condition.compile(this.locals)[0]) {
    this.content.render()
  } else {
    // this.content.destroy()
  }
}