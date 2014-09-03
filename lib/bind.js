var parser           = require('./parser')
var ast              = require('./parser/ast')
var Attribute        = require('./bindings/attribute')
var BooleanAttribute = require('./bindings/boolean-attribute')
var Expression       = require('./bindings/expression')
var If               = require('./bindings/if')

var BOOLEAN_ATTRIBUTES = ['checked', 'selected', 'disabled']

var Observer = require('./utils/observer')

module.exports = function bind(target, locals, opts) {
  if (!opts) opts = {}

  var Binding = function(path, binding) {
    path = path.slice()
    this.name = path.pop()

    var obj = locals, prop
    while (prop = path.shift()) {
      if (!(prop in obj)) return ''
      else obj = obj[prop]
    }

    this.binding  = binding
    if (obj !== null && typeof obj === 'object') {
      this.observer = Observer.create(obj)
      this.observer.observe(this.name, this.binding)
    }
  }

  Binding.prototype.render = function() {
    this.binding.render()
  }

  Binding.prototype.dispose = function() {
    if (this.observer) {
      this.observer.unobserve(this.name, this.binding)
    }
    this.binding.dispose()
    this.observer = this.binding = undefined
  }

  var nodes = []

  function handle(node) {
    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
        if (node.tagName === 'TEMPLATE') {
          var tmpl = new If(node, locals)
          nodes.push(new Binding([], tmpl))
          break
        }

        var attrs = Array.prototype.slice.call(node.attributes)
        attrs.forEach(function(attr) {
          var template = parser.parse(attr.value)
          var body = template.body
          if (body.length === 1 && body[0] instanceof ast.Text) {
            // do nothing, since this text node does not contain any expression
            return
          }

          var isBoolean = BOOLEAN_ATTRIBUTES.indexOf(attr.name) > -1
          if (body.length === 1 && body[0] instanceof ast.Expression && isBoolean) {
            var attribute = new BooleanAttribute(node, locals, body[0], attr)
            nodes.push(new Binding(body[0].path.keys, attribute))
            return
          }

          var attributes = []
          body.forEach(function(child) {
            if (child instanceof ast.Expression) {
              var attribute = new Attribute(node, locals, template, attr)
              attributes.push(new Binding(child.path.keys, attribute))
            }
          })

          if (attributes.length) nodes.push(attributes[0])
        })
        break
      case Node.TEXT_NODE:
        var body = parser.parse(node.nodeValue).body
        if (body.length === 1 && body[0] instanceof ast.Text) {
          // do nothing, since this text node does not contain any expression
          break
        }

        body.forEach(function(child) {
          var textNode = document.createTextNode(child.text || '')

          if (child instanceof ast.Expression) {
            var expression = new Expression(textNode, locals, child)
            nodes.push(new Binding(child.path.keys, expression))
          }

          nodes.push(function(node) {
            node.parentNode.insertBefore(textNode, node)
          }.bind(null, node))
        })

        nodes.push(function(node) {
          node.parentNode.removeChild(node)
        }.bind(null, node))

        break
    }
  }

  if (opts.deep === false) {
    var children = Array.prototype.slice.call(target.childNodes)
    children.forEach(handle)
  } else {
    var accept = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
    var walker = document.createTreeWalker(target, accept, function(node) {
      if (node.tagName !== 'TEMPLATE' || node === target) {
        return NodeFilter.FILTER_ACCEPT
      }

      if (node.hasAttribute('repeat') || node.hasAttribute('if')) {
        return NodeFilter.FILTER_ACCEPT
      }

      return NodeFilter.FILTER_REJECT
    }, false)

    while (walker.nextNode()) {
      handle(walker.currentNode)
    }
  }


  nodes.forEach(function(node) {
    if (typeof node === 'function') node()
    else node.render()
  })
}