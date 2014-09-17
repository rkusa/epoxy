var Program = exports.Program = function(body) {
  this.body = body || []
}

Program.prototype.compile = function(locals, opts) {
  return this.body.map(function(node) {
    return node.compile(locals, opts)
  })
}

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
  if (this.filter && opts && opts.filter && this.filter in opts.filter) {
    ref.filter = opts.filter[this.filter]
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

var Reference = function(obj, key) {
  this.obj    = obj
  this.key    = key
  this.filter = null
}

Reference.prototype.get = function() {
  var result = this.key ? (this.obj && this.obj[this.key]) : this.obj
  if (this.filter) {
    var fn = this.filter.get || this.filter
    result = fn(result)
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
