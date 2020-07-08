require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const validateBearerToken = require('./middleware/validateBearerToken')
const errorHandler = require('./middleware/errorHandler')

const { v4: uuid } = require('uuid')
const { NODE_ENV } = require('./config')
const cardRouter = require('./card/card-router')
const listRouter = require('./list/list-router')


const app = express()

app.use(morgan((NODE_ENV === 'production') ? 'tiny' : 'dev'))
app.use(helmet())
app.use(cors())
app.use(validateBearerToken)
app.use(cardRouter)
app.use(listRouter)
app.use(errorHandler) // always last in the pipeline


module.exports = app