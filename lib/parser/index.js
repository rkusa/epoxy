var parser = require('./parser').parser
exports.ast = parser.yy = require('./ast')

function parse(input) {
  return parser.parse(input)
}

exports.parse = parse