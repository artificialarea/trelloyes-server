const express = require('express')
const logger = require('./logger')
const { NODE_ENV } = require('../config')


function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN
  const authToken = req.get('Authorization')

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`); // new via winston
    return res.status(401).json({ error: 'Unauthorized request' })
  }

  next()
}

module.exports = validateBearerToken