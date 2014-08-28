var GarbageCollector = module.exports = function() {
  this.mapping = new WeakMap

  this.initialize()
}

GarbageCollector.prototype.initialize = function() {
  var mapping = this.mapping
  var observer = new MutationObserver(function(mutations) {
    console.log(mutations)
    mutations.forEach(function(mutation) {
      var removed = Array.prototype.slice.call(mutation.removedNodes)
      removed.forEach(function(node) {
        if (mapping.has(node)) {
          var obj = mapping.get(node)
          obj.dispose()
        }

        var accept = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        var walker = document.createTreeWalker(node, accept, null, false)

        while (walker.nextNode()) {
          var node = walker.currentNode
          if (mapping.has(node)) {
            var obj = mapping.get(node)
            obj.dispose()
          }
        }
      })
    })
  })

  observer.observe(document.body, {
    attributes: true, childList: true, subtree: true
  })

  delete this.initialize
}

GarbageCollector.prototype.register = function(node, obj) {
  this.mapping.set(node, obj)
}
