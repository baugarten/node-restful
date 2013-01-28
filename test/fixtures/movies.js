var users = require('./users'),
    mongoose = require('mongoose'),
    movie,
    movieobjs = [];

var moviemodel = {
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
