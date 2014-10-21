'use strict'

var Base = require('./base')

var Input = module.exports = function() {
  Base.apply(this, arguments)
  this.observe()

  var self = this
  this.node.addEventListener('change', function() {
    var value = self.set(this.value)
    if (value !== this.value) {
      this.value = value
    }
  })
}

Input.prototype = Object.create(Base.prototype, {
  constructor: { value: Input }
})

Input.prototype.render = function() {
  var value = this.value

  // <select value="{{ foobar }}"></select>
  if (this.node.tagName === 'SELECT') {
    if (value === undefined || value === '') return
    var option = this.node.querySelector('option[value=' + value + ']')
    if (option) {
      option.selected = true
    }
  }
  // otherwise
  else {
    this.node.value = value || ''
  }
}
