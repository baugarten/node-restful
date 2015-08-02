var should = require('should'),
    request = require('supertest'),
    sinon = require('sinon');

describe('Model', function() {
  var config,
      movies,
      users,
      app,
      movie1,
      movie2,
      movie3,
      user1,
      user2;
  before(function(done) {
    config = require('./fixtures/config');
    config.ready(function() {
      app = config.app;
      movies = config.movie;
      users = config.user;
      movie1 = config.movies[0];
      movie2 = config.movies[1];
      movie3 = config.movies[2];
      user1 = config.users[0];
      user2 = config.users[1];
      done();
    });
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
    it('should select fields', function(done) {
      request(app)
        .get('/api/movies?select=year')
        .end(function(err, res) {
          res.body.forEach(function(movie) {
            movie.should.not.have.property('title');
            movie.should.have.property('year');
          });
          done();
        });
    });
    it('should sort documents', function(done) {
      request(app)
        .get('/api/movies?sort=year')
        .end(function(err, res) {
          for(var i = 1; i < res.body.length; i++) {
            (res.body[i].year >= res.body[i-1].year).should.be.true;
          }
          done();
        });
    });
    it('should filter fields using equal', function(done) {
      request(app)
        .get('/api/movies?year=2011')
        .end(function(err, res) {
          res.body.forEach(function(movie) {
            movie.year.should.equal(2011);
          });
          done();
        });
    });
    it('should filter fields using gte', function(done) {
      request(app)
        .get('/api/movies?year__gte=2012')
        .end(function(err, res) {
          res.body.forEach(function(movie) {
            movie.year.should.be.above(2011);
          });
          done();
        });
    });
    it('should filter fields using gt', function(done) {
      request(app)
        .get('/api/movies?year__gt=2011')
        .end(function(err, res) {
          res.body.forEach(function(movie) {
            movie.year.should.be.above(2011);
          });
          done();
        });
    });
    it('should filter fields using lt', function(done) {
      request(app)
        .get('/api/movies?year__lt=2013')
        .end(function(err, res) {
          res.body.forEach(function(movie) {
            movie.year.should.be.below(2013);
          });
          done();
        });
    });
    it('should filter fields using lte', function(done) {
      request(app)
        .get('/api/movies?year__lte=2012')
        .end(function(err, res) {
          res.body.forEach(function(movie) {
            movie.year.should.be.below(2013);
          });
          done();
        });
    });
    it('should filter fields using ne', function(done) {
      request(app)
        .get('/api/movies?year__ne=2013')
        .end(function(err, res) {
          res.body.forEach(function(movie) {
            movie.year.should.not.equal(2013);
          });
          done();
        });
    });
    it('should filter fields using regex', function(done) {
      request(app)
        .get('/api/movies?title__regex=2')
        .end(function(err, res) {
          res.body.forEach(function(movie) {
            movie.title.should.containEql('2');
          });
          done();
        });
    });
    it('should filter fields using regex with options', function(done) {
      request(app)
        .get('/api/movies?title__regex=' + encodeURIComponent("/tITLE/i"))
        .end(function(err, res) {
          res.body.length.should.be.above(0);
          res.body.forEach(function(movie) {
            movie.title.toLowerCase().should.containEql('title');
          });
          done();
        });
    });
    it('should populate an objectId', function(done) {
      request(app)
        .get('/api/movies/' + movie1._id + '?populate=creator')
        .end(function(err, res) {
          res.body.creator.username.should.equal(user1.username);
          res.body.creator.pass_hash.should.equal(user1.pass_hash);
          done();
        });
    });
    it('should filter using in', function(done) {
      request(app)
        .get('/api/movies?year__in=2010,2011')
        .end(function(err, res) {
          res.body.forEach(function(movie) {
            [2010,2011].indexOf(movie.year).should.be.above(-1);
          });
          done();
        });
    });
    it('should filter using nin', function(done) {
      request(app)
        .get('/api/movies?year__nin=2012,2013,2014')
        .end(function(err, res) {
          res.body.length.should.be.above(0)
          res.body.forEach(function(movie) {
            [2012,2013,2014].indexOf(movie.year).should.equal(-1);
          });
          done();
        });
    });
  });
});
