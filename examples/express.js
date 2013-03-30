var express = require('express'),
    mongoose = require('mongoose'),
    restful = require('../');
var app = express();

app.use(express.bodyParser());

mongoose.connect("mongodb://localhost/express");

var user = new restful.Model({
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

var movie = new restful.Model({
  title: "movies",
  methods: ['get', 'post', 'put', 'delete'],
  schema: mongoose.Schema({
    title: { type: 'string', required: true },
    year: { type: 'number', required: true },
    creator: {type: 'ObjectId', ref: 'users' },
    comments: [{
      name: {type: 'String'},
      date: {type: 'Date'},
    }],
    meta: {
      productionco: 'string',
      director: 'string',
    },
  }),
  routes: {
    recommend: function(req, res, next) {
      res.writeHead(200, {'Content-Type': 'application/json' });
      res.write(JSON.stringify({
        hello: "HIIII",
      }));
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
      handler: function(req, res, next) {
        console.log("athirdroute");
        res.status_code = 200;
        res.bundle = {
          athirdroute: "called",
        };
        console.log("Done athirdroute");
        next();
      },
      methods: ['get', 'post'],
      detail: true,
        }
  },
});

user.register(app, '/users');
movie.register(app, '/movies');

app.listen(3000);
