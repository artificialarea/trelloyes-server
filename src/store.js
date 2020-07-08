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


module.exports = { cards, lists }