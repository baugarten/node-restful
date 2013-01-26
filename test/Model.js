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
    var moviesopts = {
      title: "movies",
      methods: ['get', 'post', 'put'],
      schema: mongoose.Schema({
        title: { type: 'string', required: true },
        year: { type: 'number' },
        creator: { type: 'ObjectId', ref: "users" },
        comments: [{ body: String, date: Date, author: { type: 'ObjectId', ref: 'users' }}],
        meta: {
          productionco: "string",
          director: { type: 'ObjectId', ref: 'users' },
        }
      }),
      update: {
        sort: false
      },
      delete: {
        sort: false
      }
    }
    var usersopts = {
      title: "users",
      methods: ['get', 'post', 'put', 'delete'],
      schema: mongoose.Schema({
        username: { type: 'string', required: true },
        pass_hash: { type: 'number', required: true },
      }),
      delete: {
        sort: false
      }
    }
    app = restful({
      hostname: 'localhost',
      db: 'testing',
    });
    movies = app.register(moviesopts);
    users = app.register(usersopts);
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
    var movie1, movie2, movie3, user1, user2;
    before(function() {
      user1 = new users.Obj({
        username: "test",
        pass_hash: 12374238719845134515,
      });
      user1.save();
      user2 = new users.Obj({
        username: "test2",
        pass_hash: 1237987381263189273123,
      });
      user2.save();
      movie1 = new movies.Obj({
        title: "Title1",
        year: 2012,
        meta: {
          productionco: "idk",
          director: user2._id,
        },
        creator: user1._id
      });
      movie1.save();
      movie2 = new movies.Obj({
        title: "Title2",
          year: 2011
      });
      movie2.save();
      movie3 = new movies.Obj({
        title: "Title3",
          year: 2013
      });
      movie3.save();
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
    it('should return a nested model at the generated endpoint', function(done) {
      request(app)
        .get('/movies/' + movie1._id + '/creator')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          console.log(res);
          res.should.be.json;
          res.body.username.should.equal('test');
          res.body.pass_hash.should.equal(12374238719845134515);
          done();
        }); 
    });
    it('should 404 if we request an object endpoint without a filter', function(done) {
      request(app)
        .get('/movies/creator')
        .expect('Content-Type', /json/)
        .expect(404, done);
    });
    it('should retrieve a deeply nested endpoint', function(done) {
      request(app)
        .get('/movies/' + movie1._id + '/meta/director')
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
        .get('/movies/' + movie1._id + '/meta')
        .expect('Content-Type', /json/)
        .expect(404, done)
    });
  });
});
