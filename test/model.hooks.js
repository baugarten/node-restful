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
    it('should call the before hook on a GET', function(done) {
      request(app).get('/api/movies')
        .end(function() { 
          movie.spies.get.before.called.should.be.true;
          movie.spies.get.after.called.should.be.true;
          done(); 
        });
    });
    it('should call the before hook on a POST', function(done) {
      request(app).post('/api/movies')
        .end(function() { 
          movie.spies.post.before.called.should.be.true;
          movie.spies.post.after.called.should.be.true;
          done(); 
        });
    });
    it('should call the before hook on a PUT', function(done) {
      request(app).put('/api/movies/' + config.movies[0]._id)
        .end(function(err, res) { 
          movie.spies.put.before.called.should.be.true;
          movie.spies.put.after.called.should.be.true;
          done(); 
        });
    });
    it.skip('should call the before hook on a DELETE', function(done) {
      request(app).get('/api/movies')
        .end(function() { 
          movie.spies.delete.before.called.should.be.true;
          movie.spies.delete.after.called.should.be.true;
          done(); 
        });
    });
  });
});
