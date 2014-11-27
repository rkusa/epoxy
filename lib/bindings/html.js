'use strict'

var Base = require('./base')

var HTML = module.exports = function() {
  Base.apply(this, arguments)
  this.observe()
}

HTML.prototype = Object.create(Base.prototype, {
  constructor: { value: HTML }
})

HTML.prototype.create = function() {
  this.destroy()

  var fragment = document.createDocumentFragment()

  var tmp = document.createElement('div')
  tmp.innerHTML = this.value

  Array.prototype.slice.call(tmp.childNodes).forEach(function(child) {
    fragment.appendChild(child)
  })

  this.startNode = fragment.firstChild
  this.endNode   = fragment.lastChild

  return fragment
}

HTML.prototype.render = function() {
  insertAfter(this.create(), this.node)
}

HTML.prototype.destroy = require('./template').prototype.destroy

function insertAfter(newElement, targetElement) {
  var parent = targetElement.parentNode

  if(parent.lastchild === targetElement) {
    parent.appendChild(newElement)
  } else {
    parent.insertBefore(newElement, targetElement.nextSibling)
  }
}