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
  describe('.handle', function() {
    it('should handle a pseudo-get route', function(done) {
      request(app)
        .get('/api/movies/fakeget')
        .end(function(err, res) {
          request(app)
            .get('/api/movies')
            .end(function(err2, res2) {
              res.body.should.eql(res2.body);
              done();
            });
        });
    });
    it('should handle a pseudo-postroute', function(done) {
      request(app)
        .post('/api/movies/fakepost')
        .send({
          title: "A very stupid movie",
        })
        .end(function(err, res) {
          res.body.title.should.equal('A very stupid movie');
          res.body._id.should.not.be.empty;
          movies.Model.findById(res.body._id, function(err, model) {
            model.title.should.equal('A very stupid movie');
            done();
          });
        });
    });
  });
});
