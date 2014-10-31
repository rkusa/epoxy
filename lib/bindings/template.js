'use strict'

var Base = require('./base')
var importNode = require('../utils/import-node')

var Template = module.exports = function() {
  Base.apply(this, arguments)

  this.startNode = this.endNode = null
}

Template.prototype = Object.create(Base.prototype, {
  constructor: { value: Template }
})

Template.prototype.create = function() {
  this.destroy()

  var bind = require('../bind')
  var clone = importNode(this.node.content, true)
  bind(clone, this.locals)

  this.startNode = clone.firstChild
  this.endNode   = clone.lastChild

  return clone
}

Template.prototype.render = function() {
  this.node.parentNode.insertBefore(this.create(), this.node)
}

Template.prototype.destroy = function() {
  if (this.startNode) {
    if (!this.startNode.parentNode) {
      return
    }

    // remove DOMNodes between start and end markers
    var node, next = this.startNode
    while ((node = next) && next !== this.endNode) {
      next = node.nextSibling
      node.parentNode.removeChild(node)
    }

    if (this.endNode.parentNode) {
      this.endNode.parentNode.removeChild(this.endNode)
    }

    this.startNode = this.endNode = null
  }
}
