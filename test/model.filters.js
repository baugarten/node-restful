var should = require('should'),
    request = require('supertest'),
    config = require('./fixtures/config'),
    sinon = require('sinon');

describe('Model', function() {
  var movies,
      users,
      app,
      movie1,
      movie2,
      movie3,
      user1,
      user2;
  before(function() {
    app = config.app;
    movies = config.movie;
    users = config.user;
    movie1 = config.movies[0];
    movie2 = config.movies[1];
    movie3 = config.movies[2];
    user1 = config.users[0];
    user2 = config.users[1];
  });
  describe('filters', function() {
    it('should limit GET to 10', function(done) {
      request(app)
        .get('/api/movies?limit=10')
        .end(function(err, res) {
          res.body.length.should.equal(10);
          done();
        });
    });
    it('should limit GET to 1', function(done) {
      request(app)
        .get('/api/movies?limit=1')
        .end(function(err, res) {
          res.body.length.should.equal(1);
          done();
        });
    });
    it('should skip by 5', function(done) {
      request(app)
        .get('/api/movies?limit=1&skip=5')
        .end(function(err, res) {
          request(app)
            .get('/api/movies?limit=6')
            .end(function(err2, res2) {
              res.body[0].should.eql(res2.body[res2.body.length-1]);
              done();
            });
        });
    });
  });
});
