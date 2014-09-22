'use strict'

var parser = require('./parser').parser
exports.ast = parser.yy = require('./ast')

function parse(input) {
  var program = parser.parse(input)
  program.source = input
  return program
}

exports.parse = parse
