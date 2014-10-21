'use strict'

var Base = require('./base')

var Text = module.exports = function() {
  Base.apply(this, arguments)
  this.observe()
}

Text.prototype = Object.create(Base.prototype, {
  constructor: { value: Text }
})

Text.prototype.render = function() {
  this.node.nodeValue = this.value
}
