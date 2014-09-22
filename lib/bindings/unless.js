'use strict'

var parser = require('../parser')
var If     = require('./if')

var Unless = module.exports = function(node, locals) {
  If.call(this, node, locals, parser.parse(node.getAttribute('unless') || ''))
}

Unless.prototype = Object.create(If.prototype, {
  constructor: { value: Unless },
  condition: {
    enumerable: true,
    get: function() {
      var result = this.value
      return !(result && result !== 'false')
    }
  }
})

Unless.isUnless = function(node) {
  return node.tagName === 'TEMPLATE' && node.hasAttribute('unless')
}
