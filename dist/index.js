
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./extraduce.cjs.production.min.js')
} else {
  module.exports = require('./extraduce.cjs.development.js')
}
