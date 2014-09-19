var parser   = require('../parser')
var Base     = require('./base')
var Template = require('./template')
var filter   = require('../filter').filter

var Repeat = module.exports = function() {
  Base.apply(this, arguments)

  var repeatAttr = this.node.getAttribute('repeat')
  if (!repeatAttr) {
    return new Template(this.node, this.locals, this.template)
  }

  this.repeat  = parser.parse(repeatAttr).body[0]
  this.mapping = new WeakMap
}

Repeat.prototype = Object.create(Base.prototype, {
  constructor: { value: Repeat }
})

Repeat.prototype.localsFor = function(row) {
  if (this.repeat.alias) {
    var locals = this.locals.slice()
    var context = {}
    context[this.repeat.alias] = row
    locals.push(context)
  } else {
    var locals = [row]
  }

  return locals
}

Repeat.prototype.render = function() {
  var rows = this.repeat.compile(this.locals, { filter: filter }).get()
  rows.forEach(function(row) {
    var template = new Template(this.node, this.localsFor(row), this.template)
    template.render()
    this.mapping.set(row, template)
  }, this)

  var self = this, template
  var handler = function(changes) {
    changes.forEach(function(change) {
      switch (change.type) {
        case 'splice':
          if (change.addedCount > 0) {
            for (var i = change.index, len = change.index + change.addedCount; i < len; ++i) {
              template = new Template(self.node, self.localsFor(rows[i]), self.template)
              template.render()
              self.mapping.set(rows[i], template)
            }
          }

          if (change.removed.length > 0) {
            change.removed.forEach(function(row) {
              if (!self.mapping.has(row)) {
                return
              }

              template = self.mapping.get(row)
              template.dispose()
              self.mapping.delete(row)
            })
          }
          break
        case 'add':
          template = new Template(self.node, self.localsFor(change.value), self.template)
          template.render()
          self.mapping.set(change.value, template)
          break
        case 'delete':
          if (!self.mapping.has(change.oldValue)) {
            return
          }

          template = self.mapping.get(change.oldValue)
          template.dispose()
          self.mapping.delete(change.oldValue)
          break
      }
    })
  }
  if (Array.isArray(rows)) {
    Array.observe(rows, handler)
  } else {
    Object.observe(rows, handler)
  }
}
