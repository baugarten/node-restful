var config = require('./fixtures/config'),
    request = require('supertest');

describe('Model', function() {
  var app, movie, user;
  before(function() {
    app = config.app;
    movie = config.movie;
    user = config.user;
  });
  describe('excludes', function() {
    it('should exclude the excluded fields', function(done) {
      request(app)
        .get('/api/movies/' + config.movies[0]._id + '/')
        .end(function(err, res) {
          res.body.should.not.have.property('secret');
          done();
        });
    });
  });
});
