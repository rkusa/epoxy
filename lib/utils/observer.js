var Observer = function(target) {
  this.target  = target
  this.mapping = Object.create(null)

  this.initialize()
}

Observer.prototype.initialize = function() {
  var self = this
  Object.observe(this.target, function(changes) {
    changes.forEach(function(change) {
      console.log(change)
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

var Factory = function() {
  this.observers = new WeakMap
}

Factory.prototype.create = function(target) {
  if (this.observers.has(target)) {
    return this.observers.get(target)
  }

  var observer = new Observer(target)
  this.observers.set(target, observer)
  return observer
}

var factory = new Factory()
exports.create = function(target) {
  return factory.create(target)
}