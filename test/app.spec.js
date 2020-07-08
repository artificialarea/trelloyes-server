const app = require('../src/app')

describe('App', () => {
  it('GET / responds with 200', () => {
    // fails because lacks API_TOKEN
    return supertest(app)
      .get('/')
      .expect(200, 'Hello, world!')
    });
});