'use strict'

var parser   = require('../parser')
var Base     = require('./base')
var Template = require('./template')
var hasNativeObserve = Object.observe && Object.observe.toString().indexOf('{ [native code] }') > -1

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

Repeat.prototype.localsFor = function(row, i) {
  var alias = this.contents[0].alias
  if (alias) {
    var locals = this.locals.slice()
    var context = {}
    if (Array.isArray(alias)) {
      context[alias[0]] = i
      context[alias[1]] = row
    } else {
      context[alias] = row
    }
    locals.push(context)
  } else {
    var locals = [row]
  }

  return locals
}

Repeat.prototype.render = function() {
  var rows = this.value

  rows.forEach(function(row, i) {
    var locals = this.localsFor(row, i)
    var template = new Template(this.node, locals, this.template)
    template.render()
    this.mapping.set(row, { template: template, locals: locals })
  }, this)

  var self = this, template
  var handler = function(changes) {
    changes.forEach(function(change) {
      switch (change.type) {
        case 'splice':
          if (change.addedCount > 0) {
            var anchor = rows[change.index + change.addedCount]
            anchor = anchor ? self.mapping.get(anchor).template.startNode : self.node

            for (var i = change.index, len = change.index + change.addedCount; i < len; ++i) {
              var locals = self.localsFor(rows[i], i)
              template = new Template(self.node, locals, self.template)
              anchor.parentNode.insertBefore(template.create(), anchor)
              self.mapping.set(rows[i], { template: template, locals: locals })
            }

            var alias = self.contents[0].alias
            if (alias && Array.isArray(alias)) {
              var indexKey = alias[0]
              for (var i = change.index + change.addedCount, len = rows.length; i < len; ++i) {
                var locals = self.mapping.get(rows[i]).locals
                locals = locals[locals.length - 1]
                var oldValue = locals[indexKey]
                locals[indexKey] = i
                if (!hasNativeObserve) {
                  Object.getNotifier(locals).notify({
                    type: 'update',
                    name: indexKey,
                    oldValue: oldValue
                  })
                }
              }
            }
          }

          if (change.removed.length > 0) {
            change.removed.forEach(function(row) {
              if (!self.mapping.has(row)) {
                return
              }

              template = self.mapping.get(row).template
              template.dispose()
              self.mapping.delete(row)
            })
          }
          break
        case 'add':
          var locals = self.localsFor(change.value, rows.indexOf(change.value))
          template = new Template(self.node, locals, self.template)
          template.render()
          self.mapping.set(change.value, { template: template, locals: locals })
          break
        case 'delete':
          if (!self.mapping.has(change.oldValue)) {
            return
          }

          template = self.mapping.get(change.oldValue).template
          template.dispose()
          self.mapping.delete(change.oldValue)
          break
      }
    })
  }

  if (Array.isArray(rows)) {
    Object.observe(rows, handler, ['add', 'update', 'delete', 'splice'])
  } else {
    Object.observe(rows, handler)
  }
}
