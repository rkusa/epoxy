var parser   = require('../parser')
var Base     = require('./base')
var Template = require('./template')

var Repeat = module.exports = function(node, locals) {
  var template = parser.parse(node.getAttribute('repeat') || '') || null

  if (template.isEmpty) {
    return new Template(node, locals)
  } else if (!template.isSingleExpression) {
    throw new Error('Only one single expression allowd for repeat templates, '
                  + 'got: ' + template.source)
  }

  Base.call(this, node, locals, template)

  this.mapping = new WeakMap
}

Repeat.prototype = Object.create(Base.prototype, {
  constructor: { value: Repeat }
})

Repeat.isRepeat = function(node) {
  return node.tagName === 'TEMPLATE' && node.hasAttribute('repeat')
}

Repeat.prototype.localsFor = function(row) {
  var alias = this.contents[0].alias
  if (alias) {
    var locals = this.locals.slice()
    var context = {}
    context[alias] = row
    locals.push(context)
  } else {
    var locals = [row]
  }

  return locals
}

Repeat.prototype.render = function() {
  var rows = this.value

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
