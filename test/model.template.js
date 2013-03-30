var should = require('should'),
    request = require('supertest'),
    config = require('./fixtures/config'),
    sinon = require('sinon');

describe.skip('Model', function() {
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
  describe('.template(route, filters)', function() {
    it('should work for get', function() {
      var template = movies.template(['get'], []);
      template.should.equal('index');
    });
    it('should work for getDetail', function() {
      var template = movies.template(['get'], [{ key: '_id', value: 'ad' }]);
      template.should.equal('show');
    });
  });
  describe('format=html', function() {
    it('should render index', function(done) {
      request(app)
        .get('/api/movies?format=html')
        .expect('Content-Type', /html/)
        .end(function(err, res) {
          res.text.should.match(/index/);
          res.text.should.match(new RegExp(movie1.title));
          res.text.should.match(new RegExp(movie2.title));
          res.text.should.match(new RegExp(movie3.title));
          done();
        });
    });
    it('should render show', function(done) {
      request(app)
        .get('/api/movies/' + movie1._id + '/?format=html')
        .expect('Content-Type', /html/)
        .end(function(err, res) {
          res.text.should.match(/show/);
          res.text.should.match(new RegExp(movie1.title));
          res.text.should.not.match(new RegExp(movie2.title));
          res.text.should.not.match(new RegExp(movie3.title));
          done();
        });

    });
  });
});
