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

///////////////////////////////////////////////////////
// GET ////////////////////////////////////////////////
///////////////////////////////////////////////////////

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


///////////////////////////////////////////////////////
// POST ///////////////////////////////////////////////
///////////////////////////////////////////////////////

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

app.post('/list', (req, res) => {
  const { header, cardIds = [] } = req.body;

  if (!header) {
    logger.error(`Header is required`);
    return res
      .status(400)
      .send('Invalid data');
  }

  // check card IDs
  if (cardIds.length > 0) {
    let valid = true;
    // We need to check that all IDs passed in the list refer to actual IDs of cards in the cards array. We want to ensure that all cards in a list actually exist. This is known as 'referential integrity'.
    cardIds.forEach(cid => {
      const card = cards.find(c => c.id == cid);
      if (!card) {
        logger.error(`Card with id ${cid} not found in cards array.`);
        valid = false;
      }
    });

    if (!valid) {
      return res
        .status(400)
        .send('Invalid data');
    }
  }

  // get an id
  const id = uuid();

  const list = {
    id,
    header,
    cardIds
  };

  lists.push(list);

  logger.info(`List with id ${id} created`);

  res
    .status(201)
    .location(`http://localhost:8000/list/${id}`)
    .json({list});
});


///////////////////////////////////////////////////////
// DELETE /////////////////////////////////////////////
///////////////////////////////////////////////////////

app.delete('/list/:id', (req, res) => {
  const { id } = req.params;

  const listIndex = lists.findIndex(li => li.id == id);

  if (listIndex === -1) {
    logger.error(`List with id ${id} not found.`);
    return res
      .status(404)
      .send('Not Found');
  }

  lists.splice(listIndex, 1);

  logger.info(`List with id ${id} deleted.`);
  res
    .status(204)
    .end();
});

// There is a relationship between cards and lists, which complicates matters when deleting cards, which can be associated with one or more lists.
// Suppose you have a card that belongs to several lists. If you delete the card, it would be necessary to also remove the card ID from those lists. Otherwise, we end up with lists referring to cards that do not exist.
// Deleting the list is a simple matter of removing it from the array of lists after validating that the ID is correct. For the card, it would be a similar task except we add the step to remove the card from all lists first.

app.delete('/card/:id', (req, res) => {
  const { id } = req.params;

  const cardIndex = cards.findIndex(c => c.id == id);

  if (cardIndex === -1) {
    logger.error(`Card with id ${id} not found.`);
    return res
      .status(404)
      .send('Not found');
  }

  // remove card from lists
  // assume cardIds are not duplicated in the cardIds array
  lists.forEach(list => {
    const cardIds = list.cardIds.filter(cid => cid !== id);
    list.cardIds = cardIds;
  });

  cards.splice(cardIndex, 1);

  logger.info(`Card with id ${id} deleted.`);

  res
    .status(204)
    .end();
});


// final middleware in the pipeline, for production
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