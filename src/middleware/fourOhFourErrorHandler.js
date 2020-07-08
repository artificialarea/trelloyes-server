const express = require('express')

// catch-all 404
// although it still registers as a 500 Internal Server Error
function fourOhFourErrorHandler(req, res, next) {
  const err = new Error('Not Found')
  err.status = 404
  return next(err)
}

module.exports = fourOhFourErrorHandler