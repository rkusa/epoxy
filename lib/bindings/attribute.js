var Base   = require('./base')

var Attribute = module.exports = function(node, locals, template, attr) {
  Base.apply(this, arguments)

  this.attr = attr

  if (!this.template.isSingleExpression) {
    this.render()
    return this
  }

  var self = this

  // <input value="{{ foobar }}" />
  // <select value="{{ foobar }}"></select>
  if ((node.tagName === 'INPUT' || node.tagName === 'SELECT') && attr.name === 'value') {
    node.addEventListener('change', function() {
      var value = self.set(this.value)
      if (value !== this.value) {
        this.value = value
      }
    })
  } else if (!(attr.name in node)) {
    var reference = this.contents[0]
    var getter = function() { return reference.get() }
    getter.parent = reference.obj
    getter.key    = reference.key
    Object.defineProperty(node, attr.name, {
      get: getter,
      set: function(val) { reference.set(val) },
      enumerable: true
    })
  }
}

Attribute.prototype = Object.create(Base.prototype, {
  constructor: { value: Attribute }
})

Attribute.prototype.render = function() {
  var value = this.value

  // <select value="{{ foobar }}"></select>
  if (this.node.tagName === 'SELECT' && this.attr.name === 'value') {
    if (value === undefined || value === '') return
    var option = this.node.querySelector('option[value=' + value + ']')
    if (option) {
      option.selected = true
    }
  }
  // otherwise
  else {
    this.attr.value = value
  }
}
