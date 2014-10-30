'use strict'

var GarbageCollector = function() {
  this.mapping = new WeakMap

  this.initialize()
}

GarbageCollector.prototype.initialize = function() {
  var mapping = this.mapping

  var observer = new MutationObserver(function(mutations) {
    var removed = []
    var added   = []

    function travers(nodes, found) {
      nodes.forEach(function(node) {
        var accept = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        var walker = document.createTreeWalker(node, accept, null, false)

        while (walker.nextNode()) {
          if (mapping.has(walker.currentNode)) {
            found.push(walker.currentNode)
          }
        }

        if (mapping.has(node)) {
          found.push(node)
        }
      })
    }

    mutations.forEach(function(mutation) {
      travers(Array.prototype.slice.call(mutation.removedNodes), removed)
      travers(Array.prototype.slice.call(mutation.addedNodes), added)
    })

    removed.forEach(function(node) {
      var index = added.indexOf(node)
      if (index === -1) {
        if (mapping.has(node)) {
          mapping.get(node).dispose()
        }
      } else {
        added.splice(index, 1)
      }
    })
  })

  function observe() {
    observer.observe(document.body, {
      attributes: true, childList: true, subtree: true
    })
  }

  if (document.readyState !== 'loading') {
    observe()
  } else {
    document.addEventListener('DOMContentLoaded', observe)
  }
}

GarbageCollector.prototype.register = function(node, obj) {
  this.mapping.set(node, obj)
}

module.exports = new GarbageCollector
