'use strict'

var Program = exports.Program = function(body, source) {
  this.body   = body || []
  this.source = source
}

Program.prototype.compile = function(locals, opts) {
  return this.body.map(function(node) {
    return node.compile(locals, opts)
  })
}

Object.defineProperties(Program.prototype, {
  isSingleExpression: {
    enumerable: true,
    get: function() {
      return this.body.length === 1 && this.body[0] instanceof Expression
    }
  },
  hasExpressions: {
    enumerable: true,
    get: function() {
      return this.body.length > 1 || (this.body.length && !(this.body[0] instanceof Text))
    }
  },
  isEmpty: {
    enumerable: true,
    get: function() {
      return this.body.length === 0
    }
  }
})

var Text = exports.Text = function(text) {
  this.text = text
}

Text.prototype.compile = function() {
  return this.text
}

var Expression = exports.Expression = function(path, alias, filter) {
  this.path   = path
  this.alias  = alias
  this.filter = filter
}

Expression.prototype.compile = function(locals, opts) {
  var ref = this.path.compile(locals)
  ref.alias = this.alias
  if (this.filter && opts && opts.filter && this.filter.name in opts.filter) {
    ref.filter = {
      name: this.filter.name,
      fn:   opts.filter[this.filter.name],
      args: this.filter.args
    }
  }
  return ref
}

var Path = exports.Path = function(path) {
  this.keys = path
}

Path.prototype.compile = function(locals) {
  if (!this.keys.length) {
    return new Reference(locals[0])
  }

  var path = this.keys.slice()

  var obj  = null
  for (var i = locals.length - 1; i >= 0; --i) {
    if (path[0] in locals[i]) {
      obj = locals[i]
      break
    }
  }

  if (!obj) {
    return new Reference()
  }

  var key = path.pop()
  var prop

  while ((prop = path.shift())) {
    if (!(prop in obj)) return ''
    else obj = obj[prop]
  }

  return new Reference(obj, key)
}

var Reference = exports.Reference = function(obj, key) {
  this.obj    = obj
  this.key    = key
  this.filter = null
}

Reference.prototype.get = function() {
  var result = this.key ? (this.obj && this.obj[this.key]) : this.obj
  if (this.filter) {
    var fn = this.filter.fn.get || this.filter.fn
    result = fn.apply(fn, [result].concat(this.filter.args || [])) // additional args: this.key, this.obj ?
  }
  return result
}

Reference.prototype.set = function(val) {
  if (!this.obj) return undefined

  if (this.filter && 'set' in this.filter) {
    val = this.filter.set(val)
  }

  return this.key ? (this.obj[this.key] = val) : (this.obj = val)
}

Reference.prototype.valueOf = Reference.prototype.toString = function() {
  return this.get()
}

var Filter = exports.Filter = function(name, args) {
  this.name = name
  this.args = args
}