var users = require('./users'),
    mongoose = require('mongoose'),
    sinon = require('sinon'),
    movie,
    movieobjs = [],
    spies = {
      get: {
        before: sinon.spy(),
        after: sinon.spy(),
      },
      put: {
        before: sinon.spy(),
        after: sinon.spy(),
      },
      post: {
        before: sinon.spy(),
        after: sinon.spy(),
      },
    }

var moviemodel = {
  title: "movies",
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
  },
  routes: {
    recommend: function(req, res, next) {
      res.writeHead(200, {'Content-Type': 'application/json' });
      res.write(JSON.stringify({
        recommend: "called",
      }));
      res.end();
    },
    anotherroute: {
      handler: function(req, res, next) {
        res.writeHead(200, {'Content-Type': 'application/json' });
        res.write(JSON.stringify({
          anotherroute: "called",
        }));
        res.end();
      },
    },
    athirdroute: {
      handler: function(req, res, next, err, obj) {
        res.writeHead(200, {'Content-Type': 'application/json' });
        res.write(JSON.stringify({
          athirdroute: "called",
          object: obj
        }));
        res.end();
      },
      methods: ['get', 'post'],
      detail: true,
    }
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
  }, { 
    title: "Title2", 
      year: 2011 
  }, { 
    title: "Title3",
      year: 2013
  }];
  movie = app.register(moviemodel);
  movie.spies = spies;
  movies.forEach(function(movieopts) {
    var obj = new movie.Obj(movieopts);
    obj.save();
    movieobjs.push(obj);
  });
  exports.movie = movie;
  exports.movies = movieobjs;
  return exports
}

exports.movie = movie;
exports.movies = movieobjs;
