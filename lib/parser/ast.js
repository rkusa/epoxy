var Program = exports.Program = function(body) {
  this.body = body || []
}

Program.prototype.compile = function(model) {
  return this.body.map(function(node) {
    return node.compile(model)
  })
}

var Text = exports.Text = function(text) {
  this.text = text
}

Text.prototype.compile = function() {
  return this.text
}

var Expression = exports.Expression = function(path, alias) {
  this.path  = path
  this.alias = alias
}

Expression.prototype.compile = function(model) {
  return this.path.compile(model)
}

var Path = exports.Path = function(path) {
  this.keys = path
}

Path.prototype.compile = function(model) {
  var path = this.keys.slice()
  var key  = path.pop()
  var obj  = model, prop

  while (prop = path.shift()) {
    if (!(prop in obj)) return ''
    else obj = obj[prop]
  }

  return new Reference(obj, key)
}

var Reference = function(obj, key) {
  this.obj = obj
  this.key = key
}

Reference.prototype.get = function() {
  return this.obj && this.obj[this.key]
}

Reference.prototype.set = function(val) {
  if (this.obj) {
    this.obj[this.key] = val
  }
}

Reference.prototype.valueOf = Reference.prototype.toString = function() {
  return this.get()
}