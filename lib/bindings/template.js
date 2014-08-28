var Base = require('./base')

var Template = module.exports = function() {
  Base.apply(this, arguments)

  this.template  = this.node
  this.startNode = this.endNode = null
}

Template.prototype = Object.create(Base.prototype, {
  constructor: { value: Template }
})

Template.prototype.render = function() {
  this.destroy()

  var bind = require('../bind')
  var clone = document.importNode(this.template.content, true)
  bind(clone, this.locals)

  this.startNode = clone.firstChild
  this.endNode   = clone.lastChild

  this.template.parentNode.insertBefore(clone, this.template)

}

Template.prototype.destroy = function() {
  if (this.startNode) {
    // remove DOMNodes between start and end markers
    var node, next = this.startNode.nextSibling
    while ((node = next) !== this.endNode) {
      next = node.nextSibling
      node.parentNode.removeChild(node)
    }

    this.startNode = this.endNode = null
  }
}