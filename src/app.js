require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const validateBearerToken = require('./middleware/validate-bearer-token')
const errorHandlerFourOhFour = require('./middleware/error-handler-four-oh-four')
const errorHandler = require('./middleware/error-handler')

const { v4: uuid } = require('uuid')
const { NODE_ENV } = require('./config')
const cardRouter = require('./routes/card.router')
const listRouter = require('./routes/list.router')


const app = express()

app.use(morgan((NODE_ENV === 'production') ? 'tiny' : 'dev'))
app.use(helmet())
app.use(cors())

app.get('/', (req, res) => {
  return res.status(200).send('Hello, world!')
})

app.use(validateBearerToken)
app.use('/card', cardRouter)
app.use('/list', listRouter)
app.use(errorHandlerFourOhFour) 
app.use(errorHandler) // always last in the pipeline


module.exports = app