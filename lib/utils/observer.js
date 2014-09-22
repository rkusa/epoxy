'use strict'

var Observer = function(target) {
  this.target  = target
  this.mapping = Object.create(null)

  this.initialize()
}

Observer.prototype.initialize = function() {
  var self = this
  Object.observe(this.target, function(changes) {
    changes.forEach(function(change) {
      switch (change.type) {
        case 'remove':
        case 'update':
          var bindings = self.mapping[change.name]
          if (!bindings) break
          bindings.forEach(function(binding) {
            binding.render()
          })
          break
      }
    })
  })

  delete this.initialize
}

Observer.prototype.observe = function(key, binding) {
  if (!(key in this.mapping)) {
    this.mapping[key] = []
  }

  this.mapping[key].push(binding)
}

Observer.prototype.unobserve = function(key, binding) {
  var index = this.mapping[key].indexOf(binding)
  if (index === -1) return
  this.mapping[key].splice(index, 1)
}

var observers = new WeakMap

exports.observe = function(binding, obj, key) {
  if (!obj || typeof obj !== 'object') {
    return
  }

  if (observers.has(obj)) {
    var observer = observers.get(obj)
  } else {
    var observer = new Observer(obj)
    observers.set(obj, observer)
  }

  observer.observe(key, binding)
}

exports.unobserve = function(binding, obj, key) {
  if (!obj || typeof obj !== 'object') {
    return
  }

  if (observers.has(obj)) {
    var observer = observers.get(obj)
  } else {
    var observer = new Observer(obj)
    observers.set(obj, observer)
  }

  observer.unobserve(key, binding)
}
