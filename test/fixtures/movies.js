var users = require('./users'),
    restful = require('../../'),
    mongoose = require('mongoose'),
    sinon = require('sinon'),
    movie,
    movieobjs = [],
    before = function(req, res, next) { next(); },
    after = function(req, res, next, err, model) { next(); },
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
      type: 'get',
      before: spies.get.before,
      after: spies.get.after,
    },
    {
      type: 'post',
      before: spies.post.before,
      after: spies.post.after,
    },
    {
      type: 'put',
      before: spies.put.before,
      after: spies.put.after,
    },
  ],
  excludes: ['secret'],
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
      res.status = 200;
      res.bundle = {
        recommend: "called",
      }
      next();
    },
    anotherroute: {
      handler: function(req, res, next) {
        res.status = 200;
        res.bundle = {
          anotherroute: "called",
        }
        next();
      },
    },
    athirdroute: {
      handler: function(req, res, next, err, obj) {
        if (err) {
          return next(err);
        }
        res.status = 200;
        res.bundle = {
          athirdroute: "called",
          object: obj
        }
        return next();
      },
      methods: ['get', 'post'],
      detail: true,
    },
    fakeget: function(req, res, next) {
      this.handle('get', function(data) {
        res.writeHeader(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(data));
        res.end();
      });
    },
    fakepost: function(req, res, next) {
      this.handle('post', [], req.body, function(data) {
        res.writeHeader(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(data));
        res.end();
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
  movie = new restful.Model(moviemodel);
  movie.register(app, '/api/movies');
  movie.spies = spies;
  movies.forEach(function(movieopts) {
    var obj = new movie.Model(movieopts);
    obj.save();
    movieobjs.push(obj);
  });
  exports.movie = movie;
  exports.movies = movieobjs;
  return exports
}

exports.movie = movie;
exports.movies = movieobjs;
