const express = require('express')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const { cards, lists } = require('../store')

const cardRouter = express.Router()
const bodyParser = express.json()


cardRouter
  .route('/card')
  .get((req, res) => {
    res.json(cards)
  })
  .post(bodyParser, (req, res) => {
    const { title, content } = req.body

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

    const id = uuid()
    const card = {
      id,
      title,
      content,
    }
    cards.push(card)
    logger.info(`Card with id ${id} created`)

    res
      .status(201)
      .location(`http://localhost:8000/card/${id}`)
      .json(card)
  })


cardRouter
  .route('/card/:id')
  .get((req, res) => {
    console.log('doh!')
    const { id } = req.params
    const card = cards.find(c => c.id == id); // NOTE use of equality operator (==) for auto type coercion.

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
  .delete((req, res) => {
    const { id } = req.params;

    const cardIndex = cards.findIndex(c => c.id == id);

    if (cardIndex === -1) {
      logger.error(`Card with id ${id} not found.`);
      return res
        .status(404)
        .send('Not found');
    }

    // There is a relationship between cards and lists, which complicates matters when deleting cards, which can be associated with one or more lists.
    // Remove card from lists
    // Assume cardIds are not duplicated in the cardIds array
    lists.forEach(list => {
      const cardIds = list.cardIds.filter(cid => cid !== id);
      list.cardIds = cardIds;
    });

    cards.splice(cardIndex, 1);

    logger.info(`Card with id ${id} deleted.`);

    res
      .status(204)
      .end();
  })

module.exports = cardRouter