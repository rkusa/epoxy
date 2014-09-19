!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.epoxy=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var parser = require('./parser')
exports.parse = parser.parse
exports.ast   = parser.ast

exports.registerFilter = require('./filter').registerFilter

exports.bind      = require('./bind')
exports.cloneNode = require('./utils/clone-node')

},{"./bind":2,"./filter":10,"./parser":12,"./utils/clone-node":14}],2:[function(require,module,exports){
var parser           = require('./parser')
var ast              = require('./parser/ast')
var Attribute        = require('./bindings/attribute')
var BooleanAttribute = require('./bindings/boolean-attribute')
var Expression       = require('./bindings/expression')
var If               = require('./bindings/if')

var BOOLEAN_ATTRIBUTES = ['checked', 'selected', 'disabled']

var Observer = require('./utils/observer')

module.exports = function bind(target, locals, opts) {
  if (!opts) opts = {}

  if (!Array.isArray(locals)) {
    locals = [locals]
  }

  var Binding = function(path, binding) {
    this.binding = binding

    path = path.slice()

    var obj = null
    for (var i = locals.length - 1; i >= 0; --i) {
      if (path[0] in locals[i]) {
        obj = locals[i]
        break
      }
    }

    if (!obj) {
      return this
    }

    var key = path.pop()
    var prop
    while ((prop = path.shift())) {
      if (!(prop in obj)) return ''
      else obj = obj[prop]
    }

    this.name    = key
    if (obj !== null && typeof obj === 'object') {
      this.observer = Observer.create(obj)
      this.observer.observe(this.name, this.binding)
    }
  }

  Binding.prototype.render = function() {
    this.binding.render()
  }

  Binding.prototype.dispose = function() {
    if (this.observer) {
      this.observer.unobserve(this.name, this.binding)
    }
    this.binding.dispose()
    this.observer = this.binding = undefined
  }

  var nodes = []

  function handle(node) {
    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
        if (node.tagName === 'TEMPLATE' && (node.hasAttribute('if') || node.hasAttribute('repeat'))) {
          var tmpl = new If(node, locals)
          nodes.push(new Binding([], tmpl))
          break
        }

        var attrs = Array.prototype.slice.call(node.attributes)
        attrs.forEach(function(attr) {
          var template = parser.parse(attr.value)
          var body = template.body
          if (body.length === 1 && body[0] instanceof ast.Text) {
            // do nothing, since this text node does not contain any expression
            return
          }

          var isBoolean = BOOLEAN_ATTRIBUTES.indexOf(attr.name) > -1
          if (body.length === 1 && body[0] instanceof ast.Expression && isBoolean) {
            var attribute = new BooleanAttribute(node, locals, body[0], attr)
            nodes.push(new Binding(body[0].path.keys, attribute))
            return
          }

          var attributes = []
          body.forEach(function(child) {
            if (child instanceof ast.Expression) {
              var attribute = new Attribute(node, locals, template, attr)
              attributes.push(new Binding(child.path.keys, attribute))
            }
          })

          if (attributes.length) nodes.push(attributes[0])
        })
        break
      case Node.TEXT_NODE:
        var body = parser.parse(node.nodeValue).body
        if (body.length === 1 && body[0] instanceof ast.Text) {
          // do nothing, since this text node does not contain any expression
          break
        }

        body.forEach(function(child) {
          var textNode = document.createTextNode(child.text || '')

          if (child instanceof ast.Expression) {
            var expression = new Expression(textNode, locals, child)
            nodes.push(new Binding(child.path.keys, expression))
          }

          nodes.push(function(node) {
            node.parentNode.insertBefore(textNode, node)
          }.bind(null, node))
        })

        nodes.push(function(node) {
          node.parentNode.removeChild(node)
        }.bind(null, node))

        break
    }
  }

  if (opts.deep === false) {
    var children = Array.prototype.slice.call(target.childNodes)
    children.forEach(handle)
  } else {
    var accept = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
    var walker = document.createTreeWalker(target, accept, function(/*node*/) {
      return NodeFilter.FILTER_ACCEPT
    }, false)

    while (walker.nextNode()) {
      handle(walker.currentNode)
    }
  }


  nodes.forEach(function(node) {
    if (typeof node === 'function') node()
    else node.render()
  })
}

},{"./bindings/attribute":3,"./bindings/boolean-attribute":5,"./bindings/expression":6,"./bindings/if":7,"./parser":12,"./parser/ast":11,"./utils/observer":16}],3:[function(require,module,exports){
var ast    = require('../parser/ast')
var Base   = require('./base')
var filter = require('../filter').filter

var Attribute = module.exports = function(node, locals, template, attr) {
  Base.apply(this, arguments)

  this.attr = attr

  var isInputValue = node.tagName === 'INPUT' && attr.name === 'value'
  var isSingleExpr = template.body.length === 1 && template.body[0] instanceof ast.Expression
  if (isInputValue && isSingleExpr) {
    var reference = template.body[0].compile(this.locals, { filter: filter })
    node.addEventListener('change', function() {
      var value = reference.set(this.value)
      if (value !== this.value) {
        this.value = value
      }
    })
  } else if (isSingleExpr && !(attr.name in node)) {
    var reference = template.body[0].compile(this.locals, { filter: filter })
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
  this.attr.value = this.template.compile(this.locals, { filter: filter }).map(function(val) {
    val = val.valueOf()
    return val === undefined || typeof val === 'object' ? '' : val
  }).join('')
}

},{"../filter":10,"../parser/ast":11,"./base":4}],4:[function(require,module,exports){
var GarbageCollector = require('../utils/garbage-collector')
var gc = new GarbageCollector

var Base = module.exports = function(node, locals, template) {
  this.node     = node
  this.locals   = locals
  this.template = template

  gc.register(node, this)
}

Base.prototype.render  = function() {}
Base.prototype.destroy = function() {}
Base.prototype.dispose = function() {
  this.destroy()
  this.node = this.locals = undefined
}

},{"../utils/garbage-collector":15}],5:[function(require,module,exports){
var Base   = require('./base')
var filter = require('../filter').filter

var BooleanAttribute = module.exports = function(node, locals, template, attr) {
  Base.apply(this, arguments)

  this.attr = attr

  this.node.removeAttribute(attr.name)
  this.reference = this.template.compile(this.locals, { filter: filter })
  if (node.tagName === 'INPUT' && attr.name === 'checked') {
    var self = this
    node.addEventListener('change', function() {
      self.reference.set(self.node[self.attr.name])
    })
  }
}

BooleanAttribute.prototype = Object.create(Base.prototype, {
  constructor: { value: BooleanAttribute }
})

BooleanAttribute.prototype.render = function() {
  this.node[this.attr.name] = this.reference.get() ? true : false
}

},{"../filter":10,"./base":4}],6:[function(require,module,exports){
var Base   = require('./base')
var filter = require('../filter').filter

var Expression = module.exports = function() {
  Base.apply(this, arguments)
}

Expression.prototype = Object.create(Base.prototype, {
  constructor: { value: Expression }
})

Expression.prototype.render = function() {
  this.node.nodeValue = this.template.compile(this.locals, { filter: filter }).get() || ''
}

Expression.prototype.destroy = function() {
  Base.prototype.destroy.call(this)
  this.obj = undefined
}

},{"../filter":10,"./base":4}],7:[function(require,module,exports){
var parser = require('../parser')
var Base   = require('./base')
var Repeat = require('./repeat')
var filter = require('../filter').filter

var If = module.exports = function() {
  Base.apply(this, arguments)

  var ifAttr = this.node.getAttribute('if')
  this.condition = ifAttr ? parser.parse(ifAttr) : null
  this.content = new Repeat(this.node, this.locals, this.template)
}

If.prototype = Object.create(Base.prototype, {
  constructor: { value: If }
})

If.prototype.render = function() {
  if (!this.condition || this.condition.compile(this.locals, { filter: filter })[0].get()) {
    this.content.render()
  }
  // TODO
  //  else {
  //   this.content.destroy()
  // }
}

},{"../filter":10,"../parser":12,"./base":4,"./repeat":8}],8:[function(require,module,exports){
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

},{"../filter":10,"../parser":12,"./base":4,"./template":9}],9:[function(require,module,exports){
var Base = require('./base')
var cloneNode = require('../utils/clone-node')

var Template = module.exports = function() {
  Base.apply(this, arguments)

  this.template  = this.node
  this.startNode = this.endNode = null
}

Template.prototype = Object.create(Base.prototype, {
  constructor: { value: Template }
})

Template.prototype.render = function() {
  this.destroy()

  var bind = require('../bind')
  var clone = cloneNode(this.template.content, true)
  bind(clone, this.locals)

  this.startNode = clone.firstChild
  this.endNode   = clone.lastChild

  this.template.parentNode.insertBefore(clone, this.template)

}

Template.prototype.destroy = function() {
  if (this.startNode) {
    // remove DOMNodes between start and end markers
    var node, next = this.startNode.nextSibling
    while ((node = next) !== this.endNode) {
      next = node.nextSibling
      node.parentNode.removeChild(node)
    }

    this.startNode = this.endNode = null
  }
}

},{"../bind":2,"../utils/clone-node":14,"./base":4}],10:[function(require,module,exports){
exports.filter = Object.create(null)

exports.registerFilter = function(name, fn) {
  exports.filter[name] = fn
}

},{}],11:[function(require,module,exports){
var Program = exports.Program = function(body) {
  this.body = body || []
}

Program.prototype.compile = function(locals, opts) {
  return this.body.map(function(node) {
    return node.compile(locals, opts)
  })
}

var Text = exports.Text = function(text) {
  this.text = text
}

Text.prototype.compile = function() {
  return this.text
}

var Expression = exports.Expression = function(path, alias, filter) {
  this.path   = path
  this.alias  = alias
  this.filter = filter
}

Expression.prototype.compile = function(locals, opts) {
  var ref = this.path.compile(locals)
  if (this.filter && opts && opts.filter && this.filter in opts.filter) {
    ref.filter = opts.filter[this.filter]
  }
  return ref
}

var Path = exports.Path = function(path) {
  this.keys = path
}

Path.prototype.compile = function(locals) {
  if (!this.keys.length) {
    return new Reference(locals[0])
  }

  var path = this.keys.slice()

  var obj  = null
  for (var i = locals.length - 1; i >= 0; --i) {
    if (path[0] in locals[i]) {
      obj = locals[i]
      break
    }
  }

  if (!obj) {
    return new Reference()
  }

  var key = path.pop()
  var prop

  while ((prop = path.shift())) {
    if (!(prop in obj)) return ''
    else obj = obj[prop]
  }

  return new Reference(obj, key)
}

var Reference = function(obj, key) {
  this.obj    = obj
  this.key    = key
  this.filter = null
}

Reference.prototype.get = function() {
  var result = this.key ? (this.obj && this.obj[this.key]) : this.obj
  if (this.filter) {
    var fn = this.filter.get || this.filter
    result = fn(result)
  }
  return result
}

Reference.prototype.set = function(val) {
  if (!this.obj) return undefined

  if (this.filter && 'set' in this.filter) {
    val = this.filter.set(val)
  }

  return this.key ? (this.obj[this.key] = val) : (this.obj = val)
}

Reference.prototype.valueOf = Reference.prototype.toString = function() {
  return this.get()
}

},{}],12:[function(require,module,exports){
'use strict'

var parser = require('./parser').parser
exports.ast = parser.yy = require('./ast')

function parse(input) {
  return parser.parse(input)
}

exports.parse = parse

},{"./ast":11,"./parser":13}],13:[function(require,module,exports){
(function (process){
/* parser generated by jison 0.4.15 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,6],$V1=[1,7],$V2=[5,8,14],$V3=[1,13],$V4=[10,12,13,15];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"expression":3,"body":4,"EOF":5,"parts":6,"part":7,"OPEN":8,"statement":9,"AS":10,"identifier":11,"CLOSE":12,"FILTER":13,"TEXT":14,"DOT":15,"IDENTIFIER":16,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",8:"OPEN",10:"AS",12:"CLOSE",13:"FILTER",14:"TEXT",15:"DOT",16:"IDENTIFIER"},
productions_: [0,[3,2],[3,1],[4,1],[6,2],[6,1],[7,5],[7,5],[7,3],[7,2],[7,1],[9,3],[9,1],[11,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 return new yy.Program($$[$0-1]) 
break;
case 2:
 return new yy.Program() 
break;
case 3: case 13:
 this.$ = $$[$0] 
break;
case 4:
 $$[$0-1].push($$[$0]); this.$ = $$[$0-1] 
break;
case 5: case 12:
 this.$ = [$$[$0]] 
break;
case 6:
 this.$ = new yy.Expression(new yy.Path($$[$0-3]), $$[$0-1]) 
break;
case 7:
 this.$ = new yy.Expression(new yy.Path($$[$0-3]), undefined, $$[$0-1]) 
break;
case 8:
 this.$ = new yy.Expression(new yy.Path($$[$0-1])) 
break;
case 9:
 this.$ = new yy.Expression(new yy.Path([])) 
break;
case 10:
 this.$ = new yy.Text($$[$0]) 
break;
case 11:
 $$[$0-2].push($$[$0]); this.$ = $$[$0-2] 
break;
}
},
table: [{3:1,4:2,5:[1,3],6:4,7:5,8:$V0,14:$V1},{1:[3]},{5:[1,8]},{1:[2,2]},{5:[2,3],7:9,8:$V0,14:$V1},o($V2,[2,5]),{9:10,11:12,12:[1,11],16:$V3},o($V2,[2,10]),{1:[2,1]},o($V2,[2,4]),{10:[1,14],12:[1,16],13:[1,15],15:[1,17]},o($V2,[2,9]),o($V4,[2,12]),o($V4,[2,13]),{11:18,16:$V3},{11:19,16:$V3},o($V2,[2,8]),{11:20,16:$V3},{12:[1,21]},{12:[1,22]},o($V4,[2,11]),o($V2,[2,6]),o($V2,[2,7])],
defaultActions: {3:[2,2],8:[2,1]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        function lex() {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:
        this.begin('epoxy')
        if (yy_.yytext) return 14
    
break;
case 1:
        return 14;
    
break;
case 2:/* skip whitespace */
break;
case 3:
        return 10;
    
break;
case 4:
        return 16;
    
break;
case 5:
        return 8;
    
break;
case 6:
        this.begin('INITIAL')
        return 12;
    
break;
case 7:
        return 15;
    
break;
case 8:
        return 13;
    
break;
case 9:
        return 5;
    
break;
}
},
rules: [/^(?:[^\x00]*?(?=(\{\{)))/,/^(?:[^\x00]+)/,/^(?:\s+)/,/^(?:as\b)/,/^(?:[^\{\}\.\s\|]+)/,/^(?:\{\{)/,/^(?:\}\})/,/^(?:\.)/,/^(?:\|)/,/^(?:$)/],
conditions: {"epoxy":{"rules":[2,3,4,5,6,7,8,9],"inclusive":false},"INITIAL":{"rules":[0,1,9],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
}).call(this,require('_process'))
},{"_process":19,"fs":17,"path":18}],14:[function(require,module,exports){
/*global HTMLTemplateElement */

'use strict'

function cloneChildren(parent, target) {
  for (var child = parent.firstChild; child; child = child.nextSibling) {
    target.appendChild(cloneNode(child, true))
  }
}

function cloneNode(node, deep) {
  var clone = document.importNode(node, false)
  if (!deep) return clone

  cloneChildren(node, clone)

  if (node instanceof HTMLTemplateElement) {
    cloneChildren(node.content, clone.content)
  }

  return clone
}

module.exports = cloneNode

},{}],15:[function(require,module,exports){
var GarbageCollector = module.exports = function() {
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
        if (mapping.has(node)) {
          mapping.get(node).dispose()
        }

        var accept = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        var walker = document.createTreeWalker(node, accept, null, false)

        while (walker.nextNode()) {
          if (mapping.has(walker.currentNode)) {
            found.push(walker.currentNode)
          }
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
        mapping.get(node).dispose()
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

},{}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){

},{}],18:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":19}],19:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},[1])(1)
});