require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const winston = require('winston')
const { v4: uuid } = require('uuid')
const { NODE_ENV } = require('./config')

const app = express()

const morganOption = (NODE_ENV === 'production') 
  ? 'tiny' 
  : 'dev';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use(express.json()) // built-in middleware to enable parsing of req.body
// set up winston
const logger = winston.createLogger({
  level: 'info',  // winston has six levels of severity: silly, debug, verbose, info, warn, and error.
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'info.log' })
  ]
})

if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// VALIDATION MIDDLEWARE
app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN
  const authToken = req.get('Authorization')

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`); // new via winston
    return res.status(401).json({ error: 'Unauthorized request' })
  }

  next()
})


// TEST DATA /////////////////////////////////
const cards = [
  {
    id: 1,
    title: 'Task One',
    content: 'This is card one',
  },
  {
    id: 2,
    title: 'Task Two',
    content: 'This is card two',
  },
  {
    id: 3,
    title: 'Task Three',
    content: 'This is card three',
  },
];
const lists = [
  {
    id: 1,
    header: 'List One',
    cardIds: [1],
  },
  {
    id: 2,
    header: 'List Two',
    cardIds: [2, 3],
  },
]
// ^^ TEST DATA /////////////////////////////////


app.get('/', (req, res) => {
  res.send('Hello, world!')
})

app.get('/card', (req, res) => {
  res
    .json(cards)
})

app.get('/list', (req, res) => {
  res
    .json(lists)
})

app.get('/card/:id', (req, res) => {
  const { id } = req.params
  const card = cards.find(c => c.id == id); // NOTE use of equality operator (==) instead of strict equality operator (===), for auto type coercion.

  if (!card) {
    logger.error(`Card with id ${id} not found.`)
    return res
      .status(404)
      .send('Card Not Found')
  }
  res
    .status(200)
    .json(card)
})

app.get('/list/:id', (req, res) => {
  const { id } = req.params
  const list = lists.find(li => li.id == id)
  
  if(!list) {
    logger.error(`List with id ${id} not found`)
    return res
      .status(400)
      .send('List Not Found')
  }
  res
    .status(200)
    .json(list)
})

app.post('/card', (req, res) => {
  const { title, content } = req.body

  // validation
  if(!title) {
    return res
      .status(400)
      .send("Invalid data. Title required.")
  }
  
  if(!content) {
    return res
      .status(400)
      .send("Invalid data. Content required.")
  }

  // at this point all validation passed

  const id = uuid()
  const card = {
    id,
    title,
    content,
  }
  cards.push(card)
  // log card creation
  logger.info(`Card with id ${id} created`)

  res
    .status(201)
    .location(`http://localhost:8000/card/${id}`)
    .json(card)

})


app.use(function errorHandler(error, req, res, next) {
  let response
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } }
  } else {
    console.error(error)
    response = { message: error.message, error }
  }
  res.status(500).json(response)
})

module.exports = app