/*global HTMLTemplateElement */

'use strict'

function cloneChildren(parent, target, fn) {
  for (var child = parent.firstChild; child; child = child.nextSibling) {
    target.appendChild(fn(child, true))
  }
}

function cloneNode(node, deep) {
  var clone = node.cloneNode(false)
  if (!deep) return clone

  cloneChildren(node, clone, cloneNode)

  if (node instanceof HTMLTemplateElement) {
    cloneChildren(node.content, clone.content, cloneNode)
  }

  return clone
}

function importNode(node, deep) {
  var clone = document.importNode(node, false)
  if (!deep) return clone

  cloneChildren(node, clone, importNode)

  if (node instanceof HTMLTemplateElement) {
    cloneChildren(node.content, clone.content, cloneNode)
  }

  return clone
}

module.exports = importNode
