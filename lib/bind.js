'use strict'

var parser        = require('./parser')
var ast           = require('./parser/ast')
var Attribute     = require('./bindings/attribute')
var BoolAttribute = require('./bindings/boolean-attribute')
var Text          = require('./bindings/text')
var HTML          = require('./bindings/html')
var If            = require('./bindings/if')
var Unless        = require('./bindings/unless')
var Repeat        = require('./bindings/repeat')
var Input         = require('./bindings/input')

var BOOLEAN = ['checked', 'selected', 'disabled']

function visitAttributeNode(node, attr, locals) {
  var template = parser.parse(attr.value)

  if (!template.hasExpressions) {
    // do nothing, since this text node does not contain any expression
    return
  }

  if (BOOLEAN.indexOf(attr.name) > -1) {
    var attribute = new BoolAttribute(node, locals, template, attr)
    attribute.render()
    return
  }

  if ((node instanceof HTMLInputElement || node instanceof HTMLSelectElement) && attr.name === 'value') {
    var input = new Input(node, locals, template)
    input.render()
    return
  }

  var attribute = new Attribute(node, locals, template, attr)
  attribute.render()
  return
}

function visitElementNode(node, locals) {
  if (If.isIf(node) || Unless.isUnless(node) || Repeat.isRepeat(node)) {
    var tmpl = Unless.isUnless(node)
        ? new Unless(node, locals)
        : new If(node, locals)
    tmpl.render()
    return
  }

  var attrs = Array.prototype.slice.call(node.attributes)
  attrs.forEach(function(attr) {
    visitAttributeNode(node, attr, locals)
  })

  switch (node.tagName) {
    case 'TEXTAREA':
      var input = new Input(node, locals, parser.parse(node.value))
      input.render()
      break
    case 'TEMPLATE':
      node.locals = locals
      break
  }
}

function visitTextNode(node, locals) {
  var template = parser.parse(node.nodeValue)

  if (!template.hasExpressions) {
    // do nothing, since this text node does not contain any expression
    return
  }

  template.body.forEach(function(child) {
    var binding

    if (child instanceof ast.Expression) {
      var isHTML = false
      for (var i = 0, len = child.filters.length; i < len; ++i) {
        if (child.filters[i].name === 'html') {
          isHTML = true
          child.filters.splice(i, 1)
          break
        }
      }

      if (!isHTML) {
        binding = new Text(document.createTextNode(child.text || ''), locals, child)
      } else {
        binding = new HTML(document.createComment(''), locals, child)
      }

      node.parentNode.insertBefore(binding.node, node)
      binding.render()
    } else {
      node.parentNode.insertBefore(document.createTextNode(child.text || ''), node)
    }
  })

  node.nodeValue = ''
}

module.exports = function bind(target, locals, opts) {
  if (!opts) opts = {}

  if (!Array.isArray(locals)) {
    locals = [locals]
  }

  function handle(node) {
    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
        visitElementNode(node, locals)
        break
      case Node.TEXT_NODE:
        visitTextNode(node, locals)
        break
    }
  }

  if (opts.deep === false) {
    for (var child = target.firstChild; child; child = child.nextSibling) {
      handle(child)
    }
  } else {
    var accept = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
    var walker = document.createTreeWalker(target, accept, null, false)

    while (walker.nextNode()) {
      handle(walker.currentNode)
    }
  }
}
