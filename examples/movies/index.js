var express = require('express'),
    mongoose = require('mongoose'),
    restful = require('../../');
var app = exports = module.exports = express();

app.use(express.bodyParser());
app.use(express.query());
app.set('view engine', 'jade');
app.mongoose = mongoose;

mongoose.connect("mongodb://localhost/movies_test");

var user = app.user = restful.model('users', mongoose.Schema({
    username: { type: 'string', required: true },
    pass_hash: { type: 'number', required: true }
  }))
  .methods(['get', 'post', 'put', 'delete'])
  .delete({
    sort: false
  });

function noop(req, res, next) { next(); }

var movie = app.movie = restful.model("movies", mongoose.Schema({
    title: { type: 'string', required: true },
    year: { type: 'number', required: true },
    creator: {type: 'ObjectId', ref: 'users' },
    comments: [{
      body: {type: 'String'},
      date: {type: 'Date'},
      author: { type: 'ObjectId', ref: 'users' }
    }],
    meta: {
      productionco: 'string',
      director: { type: 'ObjectId', ref: 'users' }
    },
    secret: { type: 'string', select: false }
  }))
  .methods([{ 
      method: 'get', 
      before: noop,
      after: noop
    }, 'post', 'put', 'delete'])
  .route('recommend', function(req, res, next) {
      res.writeHead(200, {'Content-Type': 'application/json' });
      res.write(JSON.stringify({
        recommend: "called"
      }));
      res.end();
  })
  .route('anotherroute', function(req, res, next) {
    res.writeHead(200, {'Content-Type': 'application/json' });
    res.write(JSON.stringify({
      anotherroute: "called"
    }));
    res.end();
  })
  .route('athirdroute', {
    handler: function(req, res, next) {
      res.status_code = 200;
      res.bundle = {
        athirdroute: "called"
      };
      next();
    },
    methods: ['get', 'post'],
    detail: true
  })
  .before('post', noop)
  .after('post', noop)
  .before('put', noop)
  .after('put', noop);

user.register(app, '/users');
movie.register(app, '/api/movies');

if (!module.parent) {
  app.listen(3000);
}
