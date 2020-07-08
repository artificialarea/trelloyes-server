require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const validateBearerToken = require('./middleware/validateBearerToken')
const fourOhFourErrorHandler = require('./middleware/fourOhFourErrorHandler')
const serverErrorHandler = require('./middleware/serverErrorHandler')

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
app.use(fourOhFourErrorHandler) 
app.use(serverErrorHandler) // always last in the pipeline


module.exports = app