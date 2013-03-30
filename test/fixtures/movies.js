var users = require('./users'),
    restful = require('../../'),
    mongoose = require('mongoose'),
    sinon = require('sinon'),
    Movie,
    movieobjs = [],
    before = function(req, res, next) { next(); },
    after = function(req, res, next) { next(); },
    spies = {
      get: {
        before: sinon.spy(before),
        after: sinon.spy(after),
      },
      put: {
        before: sinon.spy(before),
        after: sinon.spy(after),
      },
      post: {
        before: sinon.spy(before),
        after: sinon.spy(after),
      },
    }

var moviemodel = {
  title: "movies",
  template: __dirname + '/movies/',
  methods: [
    {
      method: 'get',
      before: spies.get.before,
      after: spies.get.after,
    },
    {
      method: 'post',
      before: spies.post.before,
      after: spies.post.after,
    },
    {
      method: 'put',
      before: spies.put.before,
      after: spies.put.after,
    },
  ],
  schema: mongoose.Schema({
    title: { type: 'string', required: true },
    year: { type: 'number' },
    creator: { type: 'ObjectId', ref: "users" },
    comments: [{ body: String, date: Date, author: { type: 'ObjectId', ref: 'users' }}],
    meta: {
      productionco: "string",
      director: { type: 'ObjectId', ref: 'users' },
    },
    secret: { type: 'string', select: false }
  }),
  update: {
    sort: false
  },
  delete: {
    sort: false
  },
  routes: {
    recommend: function(req, res, next) {
      res.status_code = 200;
      res.bundle = {
        recommend: "called"
      }
      next();
    },
    anotherroute: {
      handler: function(req, res, next) {
        res.status_code = 200;
        res.bundle = {
          anotherroute: "called",
        }
        next();
      },
    },
    athirdroute: {
      handler: function(req, res, next) {
        res.status_code = 200;
        res.bundle = {
          athirdroute: "called"
        };
        return next();
      },
      methods: ['get', 'post'],
      detail: true
    },
    fakeget: function(req, res, next) {
      this.handle('get', function(data) {
        this.status_code = 200;
        this.bundle = data;
        next();
      });
    },
    fakepost: function(req, res, next) {
      this.handle('post', [], req.body, function(data) {
        this.status_code = 200;
        this.bundle = data;
        next();
      });
    },
  },
  version: "api",
}

exports.register = function(app) {
  if (users.users.length < 1 || !users.users[0]._id) {
    throw new Error("Movies must be registered after users");
  }
  var movies = [{
    title: "Title1",
    year: 2012,
    meta: {
      productionco: "idk",
      director: users.users[1]._id,
    },
    creator: users.users[0]._id,
    secret: "A SECRET STRING",
  }, { 
    title: "Title2", 
      year: 2011 
  }, { 
    title: "Title3",
      year: 2013
  }];
  console.log(moviemodel.template);
  Movie = restful.model('movies', moviemodel.schema)
    .methods(moviemodel.methods)
    .template(moviemodel.template)
    .route(moviemodel.routes);
  Movie.register(app, '/api/movies');
  Movie.spies = spies;
  movies.forEach(function(movieopts) {
    var obj = new Movie(movieopts);
    obj.save();
    movieobjs.push(obj);
  });
  exports.movie = Movie;
  exports.movies = movieobjs;
  return exports
}

exports.movie = Movie;
exports.movies = movieobjs;
