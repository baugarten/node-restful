var config = require('./fixtures/config'),
    request = require('supertest'),
    sinon = require('sinon');

describe('Model', function() {
  var app, movie, user;
  before(function() {
    app = config.app;
    movie = config.movie;
    user = config.user;
  });
  describe('before hook', function() {
    it('should call the before hook on a GET', function() {
      movie.routes.get.before.length.should.equal(1);
      movie.routes.get.after.length.should.equal(1);
    });
    it('should call the before hook on a POST', function() {
      movie.routes.post.before.length.should.equal(1);
      movie.routes.post.after.length.should.equal(1);
    });
    it('should call the before hook on a PUT', function() {
      movie.routes.put.before.length.should.equal(1);
      movie.routes.put.after.length.should.equal(1);
    });
  });
});
