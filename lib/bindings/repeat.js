var parser   = require('../parser')
var Base     = require('./base')
var Template = require('./template')

var Repeat = module.exports = function() {
  Base.apply(this, arguments)

  var repeatAttr = this.node.getAttribute('repeat')
  if (!repeatAttr) {
    return new Template(this.node, this.locals, this.template)
  }

  this.repeat  = parser.parse(repeatAttr)
  this.mapping = new WeakMap
}

Repeat.prototype = Object.create(Base.prototype, {
  constructor: { value: Repeat }
})

Repeat.prototype.render = function() {

  var rows = this.repeat.compile(this.locals)[0].get()
  rows.forEach(function(row) {
    var template = new Template(this.node, row, this.template)
    template.render()
    this.mapping.set(row, template)
  }, this)

  var self = this
  Array.observe(rows, function(changes) {
    changes.forEach(function(change) {
      if (change.type !== 'splice') {
        return
      }

      if (change.addedCount > 0) {
        for (var i = change.index, len = change.index + change.addedCount; i < len; ++i) {
          console.log('i', i)
          var template = new Template(self.node, rows[i], self.template)
          template.render()
        }
      }

      if (change.removed.length > 0) {
        change.removed.forEach(function(row) {
          if (!self.mapping.has(row)) {
            return
          }

          var template = self.mapping.get(row)
          template.dispose()
          self.mapping.delete(row)
        })
      }
    })
  })
}