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
    it('should call after all hook on user defined all route', function(done) {
      request(app)
        .get('/api/movies/recommend')
        .end(function(err, res) {
          res.body.recommend.should.equal('called');
          res.body.after.should.equal('called');
          done();
        });
    });
    it('should call before all hook on user defined get route', function(done) {
      request(app)
        .get('/api/movies/' + config.movies[2]._id + '/athirdroute')
        .end(function(err, res) {
          res.body.athirdroute.should.equal('called');
          res.body.after.should.equal('called');
          done();
        });
    });
    it('should use the properties set in a before route for filtering', function(done) {
      request(app)
        .get('/users')
        .end(function(err, res) {
          console.log(res.body);
          res.body.should.have.length(1);
          done(err);
        });
    });
  });
});
