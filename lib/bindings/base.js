'use strict'

var ast      = require('../parser/ast')
var gc       = require('../utils/garbage-collector')
var observer = require('../utils/observer')
var filter   = require('../filter').filter

var Base = module.exports = function(node, locals, template) {
  this.node      = node
  this.locals    = locals
  this.template  = template
  this.observing = []
  this.contents  = template && template.compile(locals, { filter: filter }) || []
  if (!Array.isArray(this.contents)) {
    this.contents = [this.contents]
  }

  gc.register(node, this)
}

Object.defineProperties(Base.prototype, {
  value: {
    enumerable: true,
    get: function() {
      if (this.template.isSingleExpression) {
        return this.contents[0].get()
      } else {
        return this.contents.map(function(val) {
          val = val.valueOf()
          return val === undefined || typeof val === 'object' ? '' : val
        }).join('')
      }
    },
    set: function(val) {
      this.set(val)
    }
  }
})

Base.prototype.observe = function() {
  this.contents.forEach(function(node) {
    if (node instanceof ast.Reference && node.obj && node.key) {
      this.observing.push(node)
      observer.observe(this, node.obj, node.key)
      node.change = this.render.bind(this)

      node.filters.forEach(function(filter) {
        if (!filter.args) return
        filter.args.forEach(function(arg) {
          if (arg instanceof ast.Reference && arg.obj && arg.key) {
            this.observing.push(arg)
            observer.observe(this, arg.obj, arg.key)
            arg.change = this.render.bind(this)
          }
        }, this)
      }, this)
    }
  }, this)
}

Base.prototype.set = function(val) {
  if (this.template.isSingleExpression) {
    return this.contents[0].set(val)
  }

  return val
}

Base.prototype.render  = function() {}
Base.prototype.destroy = function() {}

Base.prototype.dispose = function() {
  this.destroy()
  this.observing.forEach(function(node) {
    if (node instanceof ast.Reference) {
      observer.unobserve(this, node.obj, node.key)

      node.filters.forEach(function(filter) {
        if (!filter.args) return
        filter.args.forEach(function(arg) {
          if (arg instanceof ast.Reference && arg.obj && arg.key) {
            observer.unobserve(this, arg.obj, arg.key)
          }
        }, this)
      }, this)
    }
  }, this)
  this.contents.forEach(function(content) {
    if (content && typeof content.dispose === 'function') {
      content.dispose()
    }
  })
  this.observing.length = this.contents.length = 0
  this.node = this.locals = this.template = undefined
}
