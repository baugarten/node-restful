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
      var before = movie.spies.get.before.callCount;
      var before2 = movie.spies.get.after.callCount
      request(app).get('/api/movies')
        .end(function() { 
          movie.spies.get.before.called.should.be.true;
          movie.spies.get.after.called.should.be.true;
          movie.spies.get.before.callCount.should.equal(before + 1);
          movie.spies.get.after.callCount.should.equal(before2 + 1);
          done(); 
        });
    });
    it('should call the before hook on a POST', function(done) {
      var before = movie.spies.post.before.callCount;
      var before2 = movie.spies.post.after.callCount
      request(app).post('/api/movies')
        .end(function() { 
          movie.spies.post.before.called.should.be.true;
          movie.spies.post.after.called.should.be.true;
          movie.spies.post.before.callCount.should.equal(before + 1);
          movie.spies.post.after.callCount.should.equal(before2 + 1);
          done(); 
        });
    });
    it('should call the before hook on a PUT', function(done) {
      var before = movie.spies.put.before.callCount;
      var before2 = movie.spies.put.after.callCount
      request(app).put('/api/movies/' + config.movies[0]._id)
        .end(function(err, res) { 
          movie.spies.put.before.called.should.be.true;
          movie.spies.put.after.called.should.be.true;
          movie.spies.put.before.callCount.should.equal(before + 1);
          movie.spies.put.after.callCount.should.equal(before2 + 1);
          done(); 
        });
    });
  });
});
