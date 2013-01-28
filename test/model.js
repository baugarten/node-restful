var restful = require('../'), 
    Model = require('../lib/model'),
    mongoose = require('mongoose'),
    assert = require('assert'),
    should = require('should'),
    request = require('supertest'),
    config = require('./fixtures/config');

describe('Model', function() {
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
    
  describe('.populateRoutes', function() {
    it('should populate routes for the given methods', function() {
      movies.routes['get'].should.be.a('function');
      movies.routes['post'].should.be.a('function');
      movies.routes['put'].should.be.a('function');
      movies.routes.should.not.have.property('delete');

      users.routes['get'].should.be.a('function');
      users.routes['post'].should.be.a('function');
      users.routes['put'].should.be.a('function');
      users.routes['delete'].should.be.a('function');
    });
  });

  describe('.dispatch', function() {
    it('should dispatch to GET', function(done) {
      request(app)
        .get('/api/movies')
        .expect('Content-Type', /json/)
        .expect(200, done)
    }); 
    it('should fail POST with no data', function(done) {
      request(app)
        .post('/api/movies')
        .expect('Content-Type', /json/)
        .expect(400, done)
    });
    it('should POST with data', function(done) {
      request(app)
        .post('/api/movies')
        .send({
          title: "A very stupid movie",  
        })
        .expect('Content-Type', /json/)
        .expect(201, done)
    });
    it('should fail on PUT without filter on unsortable model', function(done) {
      request(app)
        .put('/api/movies')
        .send({
          title: "A very stupid movie",  
        })
        .expect('Content-Type', /json/)
        .expect(404, done)
    });
    it('should fail on DELETE without a filter', function(done) {
      request(app)
        .del('/users')
        .expect('Content-Type', /json/)
        .expect(404, done)
    });
    it('should 404 on undefined route', function(done) {
      request(app)
        .del('/api/movies')
        .expect('Content-Type', /json/)
        .expect(404, done)
    });
    it('should return a nested model at the generated endpoint', function(done) {
      request(app)
        .get('/api/movies/' + movie1._id + '/creator')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.should.be.json;
          res.body.username.should.equal('test');
          res.body.pass_hash.should.equal(12374238719845134515);
          done();
        }); 
    });
    it('should 404 if we request an object endpoint without a filter', function(done) {
      request(app)
        .get('/api/movies/creator')
        .expect('Content-Type', /json/)
        .expect(404, done);
    });
    it('should retrieve a deeply nested endpoint', function(done) {
      request(app)
        .get('/api/movies/' + movie1._id + '/meta/director')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          res.should.be.json;
          res.body.username.should.equal('test2');
          res.body.pass_hash.should.equal(1237987381263189273123);
          done();
        });

    });
    it('should 404 on a nested object', function(done) {
      request(app)
        .get('/api/movies/' + movie1._id + '/meta')
        .expect('Content-Type', /json/)
        .expect(404, done)
    });
    it('should get a user defined route', function(done) {
      request(app)
        .get('/api/movies/recommend')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          res.should.be.json;
          res.body.recommend.should.equal("called");
          done();
        });
    });
    it('should get anotheroute (user defined route)', function(done) {
      request(app)
        .get('/api/movies/anotherroute')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          res.should.be.json;
          res.body.anotherroute.should.equal("called");
          done();
        });
    });
    it('should get athirdroute (user defined route)', function(done) {
      request(app)
        .get('/api/movies/' + movie1._id + '/athirdroute')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          res.should.be.json;
          res.body.athirdroute.should.equal("called");
          res.body.object._id.should.equal(String(movie1._id));
          done();
        });
    });
    it('should fail athirdroute (user defined route)', function(done) {
      request(app)
        .get('/api/movies/athirdroute')
        .expect('Content-Type', /json/)
        .expect(404, done);
    });
    it('should fail athirdroute (user defined route)', function(done) {
      request(app)
        .put('/api/movies/athirdroute')
        .expect('Content-Type', /json/)
        .expect(404, done);
    });
  });
});
