var config = require('./fixtures/config');

describe('Model', function() {
  var movie, user, app;
  before(function() {
    app = config.app;
    movie = config.movie;
    user = config.user;
  });
  describe('.populateRoutes', function() {
    it('should populate routes for the given methods', function() {
      movie.routes['get'].should.be.a('function');
      movie.routes['post'].should.be.a('function');
      movie.routes['put'].should.be.a('function');
      movie.routes['schema']['__all__'].should.be.a('function');
      movie.routes.should.not.have.property('delete');

      user.routes['get'].should.be.a('function');
      user.routes['post'].should.be.a('function');
      user.routes['put'].should.be.a('function');
      user.routes['delete'].should.be.a('function');
      user.routes['schema']['__all__'].should.be.a('function');
    });
  });
});
