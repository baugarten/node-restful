var restful = require('../'), 
    Model = require('../lib/model'),
    mongoose = require('mongoose'),
    assert = require('assert'),
    should = require('should'),
    request = require('supertest');

describe('Model', function() {
  var movies, 
      users,
      app; 
  before(function() {
    movies = new Model({
      title: "movies",
      methods: ['get', 'post', 'put'],
      schema: mongoose.Schema({
        title: { type: 'string', required: true },
        year: { type: 'number' },
      }),
      update: {
        sort: false
      },
      delete: {
        sort: false
      }
    });
    users = new Model({
      title: "users",
      methods: ['get', 'post', 'put', 'delete'],
      schema: mongoose.Schema({
        username: { type: 'string', required: true },
        pass_hash: { type: 'number', required: true },
      }),
      delete: {
        sort: false
      }
    });
    app = restful({
      hostname: 'localhost',
      db: 'testing',
    });
    movies.register(app);
    users.register(app);
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
    before(function() {
      new movies.Obj({
        title: "Title1",
          year: 2012
      }).save();
      new movies.Obj({
        title: "Title2",
          year: 2011
      }).save();
      new movies.Obj({
        title: "Title3",
          year: 2013
      }).save();
    });
    it('should dispatch to GET', function(done) {
      request(app)
        .get('/movies')
        .expect('Content-Type', /json/)
        .expect(200, done)
    }); 
    it('should fail POST with no data', function(done) {
      request(app)
        .post('/movies')
        .expect('Content-Type', /json/)
        .expect(400, done)
    });
    it('should POST with data', function(done) {
      request(app)
        .post('/movies')
        .send({
          title: "A very stupid movie",  
        })
        .expect('Content-Type', /json/)
        .expect(201, done)
    });
    it('should fail on PUT without filter on unsortable model', function(done) {
      request(app)
        .put('/movies')
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
        .del('/movies')
        .expect('Content-Type', /json/)
        .expect(404, done)
    });
  });
});
