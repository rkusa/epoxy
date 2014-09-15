/*global HTMLTemplateElement */

'use strict'

function cloneChildren(parent, target) {
  for (var child = parent.firstChild; child; child = child.nextSibling) {
    target.appendChild(cloneNode(child, true))
  }
}

function cloneNode(node, deep) {
  var clone = document.importNode(node, false)
  if (!deep) return clone

  cloneChildren(node, clone)

  if (node instanceof HTMLTemplateElement) {
    cloneChildren(node.content, clone.content)
  }

  return clone
}

module.exports = cloneNode
