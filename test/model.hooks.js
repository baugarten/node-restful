var config = require('./fixtures/config'),
    request = require('supertest'),
    sinon = require('sinon'),
    _ = require('underscore');

describe('Model', function() {
  var app, movie, user;
  before(function() {
    app = config.app;
    movie = config.movie;
    user = config.user;
  });
  describe('before hook', function() {
    it('should call the before hook on a GET', function() {
      console.log(movie.routes);
      console.log("REOUELJRLSJF", _.findWhere(movie.routes, { path: "", method: "index" }))
      _.findWhere(movie.routes, { path: "", method: "index" }).before.length.should.equal(1);
      _.findWhere(movie.routes, { path: "", method: "detail" }).before.length.should.equal(1);
      _.findWhere(movie.routes, { path: "", method: "index" }).after.length.should.equal(1);
      _.findWhere(movie.routes, { path: "", method: "detail" }).after.length.should.equal(1);
    });
    it('should call the before hook on a POST', function() {
      _.findWhere(movie.routes, { path: "", method: "post" }).before.length.should.equal(1);
      _.findWhere(movie.routes, { path: "", method: "post" }).after.length.should.equal(1);
    });
    it('should call the before hook on a PUT', function() {
      _.findWhere(movie.routes, { path: "", method: "put" }).before.length.should.equal(1);
      _.findWhere(movie.routes, { path: "", method: "put" }).after.length.should.equal(1);
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
  });
});
