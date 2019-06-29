var should = require('should'),
    request = require('supertest'),
    sinon = require('sinon');

describe('Model', function() {
  var config,
      books,
      app;
  before(function(done) {
    config = require('./fixtures/books/config');
    config.ready(function() {
      app = config.app;          
      books = config.book;
      done();
    });
  });
  describe('find by', function() {
    it('should return ken wilbers book: No Boundary: Eastern and Western Approaches to Personal Growth', function (done) {
      request(app)
        .get('/api/books')
        .end(function (err, res) {
          should(res.body).is
          res.body[0].should.eql( 
            { _id: '5d01f7e7ea7ac0206cacf8e0',
            title: 'No Boundary: Eastern and Western Approaches to Personal Growth',
            description: '',
            author: 'Ken Wilber',
            topic: 'transpersonal-psychology' });
          done();
        });
    });
  });
});
