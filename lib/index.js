var parser = require('./parser')
exports.parse = parser.parse
exports.ast   = parser.ast

exports.bind  = require('./bind')
