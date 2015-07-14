var should = require('should'),
    request = require('supertest'),
    config = require('./fixtures/config'),
    sinon = require('sinon'),
    checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");

var oldA = should.Assertion.prototype.a;
should.Assertion.prototype.a = function(type, desc) {
  if (type === '_id') {
    this.assert(checkForHexRegExp.test(this.obj),
        function() { return 'expected ' + this.inspect + ' to be a ' + type + (desc ? " | " + desc : ""); },
        function(){ return 'expected ' + this.inspect + ' not to be a ' + type  + (desc ? " | " + desc : ""); });
    return this;
  }
  return oldA.call(this, type, desc);
};

describe('Model', function() {
  var movies, 
      users,
      app, 
      movie1, 
      movie2, 
      movie3, 
      user1, 
      user2;
  before(function(done) {
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
  describe('handlers', function() {
    it('should handle schema request', function(done) {
      request(app)
        .get('/api/movies/schema')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          res.body.resource.should.equal('movies');
          res.body.allowed_methods.should.eql(Object.keys(movies.allowed_methods));
          res.body.fields.should.be.an.instanceOf(Object);
          Object.keys(movies.schema.paths).forEach(function(path) {
            res.body.fields.should.have.property(path);
          });
          res.body.list_uri.should.equal('/api/movies');
          res.body.detail_uri.should.equal('/api/movies/:id');
          done();
        });
    });
    
    it('should dispatch to GET', function(done) {
      request(app)
        .get('/api/movies')
        .expect('Content-Type', /json/)
        .expect(200, done);
    }); 
    it('should fail POST with no data', function(done) {
      request(app)
        .post('/api/movies')
        .expect('Content-Type', /json/)
        .expect(400, done);
    });
    it('should POST with data', function(done) {
      request(app)
        .post('/api/movies')
        .send({
          title: "A very stupid movie",
          year: "214243"
        })
        .expect('Content-Type', /json/)
        .expect(201 )
        .end(function(err, res) {
          res.body.title.should.equal('A very stupid movie');
          res.body._id.should.type('string');
          done(err);
        });
    });
    it('should PUT data', function(done) {
      request(app)
        .put('/api/movies/' + movie2._id)
        .send({
          title: 'I changed the movie title'
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          res.body.title.should.equal('I changed the movie title');
          movies.findById(movie2._id, function(err, movie) {
            movie.title.should.equal('I changed the movie title');
            done();
          });
        });
    });
    it('should fail on PUT without filter on unsortable model', function(done) {
      request(app)
        .put('/api/movies')
        .send({
          title: "A very stupid movie"
        })
        .expect(404, done);
    });
    it('should fail on DELETE without a filter', function(done) {
      request(app)
        .del('/users')
        .expect(404, done);
    });
    it('should DELETE a movie', function(done) {
      request(app)
        .del('/api/movies/' + movie3._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          movies.findById(movie3._id, function(err, movie) {
            should.not.exist(movie);
            done();
          });
        });
    });
    it("shouldn't put data on deleted resource", function(done) {
      request(app)
        .del('/api/movies/' + config.movies[5]._id)
        .end(function(err, res) {
          request(app)
            .put('/api/movies/' + config.movies[5]._id)
            .send({
              title: 'But I already deleted you'
            })
          .expect(400, done);
        });
    });
    it('should 400 deleting a resource twice', function(done) {
      request(app)
        .del('/api/movies/' + config.movies[6]._id)
        .end(function() {
          request(app)
            .del('/api/movies/' + config.movies[6]._id)
            .expect(400, done);
        });
    });
    it('should 404 on undefined route', function(done) {
      request(app)
        .del('/api/movies')
        .expect(404, done);
    });
    it('should return a nested model at the generated endpoint creator', function(done) {
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
          done();
        });
    });
    it('should fail athirdroute (user defined route)', function(done) {
      request(app)
        .get('/api/movies/athirdroute')
        .expect(404, done);
    });
    it('should fail athirdroute (user defined route)', function(done) {
      request(app)
        .put('/api/movies/' + movie1._id + '/athirdroute')
        .expect(404, done);
    });
    it('should allow put of entire object', function(done) {
      request(app)
        .get('/api/movies/' + config.movies[7]._id)
        .end(function(err, res) {
          var movie = res.body;
          movie.title = 'A different title';
          request(app)
            .put('/api/movies/' + movie._id)
            .send(movie)
            .expect('Content-Type', /json/)
            .expect(201)
            .end(function(err, res) {
              res.body.title.should.equal('A different title');
              done();
            });
        });
    });
    it('should allow overriding of schema route', function(done) {
      request(app)
        .get('/users/schema')
        .expect(404, done);
    });
    it('should allow multiple handlers to be called on a single route', function(done) {
      request(app)
        .get('/api/movies/pshh')
        .expect(200)
        .end(function(err, res) {
          res.body.pshh.should.equal('called');
          done(err);
        });
    });
  });
});
