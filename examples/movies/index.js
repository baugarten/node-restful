var express = require('express'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    mongoose = require('mongoose'),
    morgan = require('morgan'),
    restful = require('../../');
var app = module.exports = express();

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({type:'application/vnd.api+json'}));
app.use(methodOverride());
app.set('view engine', 'jade');

app.mongoose = mongoose; // used for testing

mongoose.connect("mongodb://localhost/movies_test");

var user = app.user = restful.model('users', mongoose.Schema({
    username: { type: 'string', required: true },
    pass_hash: { type: 'number', required: true }
  }))
  .methods(['get', 'post', 'put', 'delete'])
  .before('get', function(req, res, next) {
    req.body.limit = 1;
    next()
  })
  .removeOptions({
    sort: 'field -username'
  })
  .includeSchema(false);


var movie = app.movie = restful.model("movies", mongoose.Schema({
    title: { type: 'string', required: true },
    year: { type: 'number', required: true },
    creator: {type: 'ObjectId', ref: 'users' },
    genre: {type: 'ObjectId', ref: 'genres'},
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
  }));

movie.methods([
    { 
      method: 'get', 
      before: noop,
      after: noop
    }, 
    'post', 
    'put', 
    'delete'])
  .updateOptions({ new: true })
  .route('recommend', function(req, res, next) {
    res.locals.status_code = 200;
    res.locals.bundle.recommend = 'called';
    next();
  })
  .route('anotherroute', function(req, res, next) {
    res.writeHead(200, {'Content-Type': 'application/json' });
    res.write(JSON.stringify({
      anotherroute: "called"
    }));
    res.end(); // This ends the request and prevents any after filters from executing
  })
  .route('athirdroute', {
    handler: function(req, res, next) {
      res.locals.status_code = 200; // Store response status code
      res.locals.bundle = {
        athirdroute: "called" // And response data
      };
      next(); // Call *after* filters and then return the response
    },
    methods: ['get', 'post'],
    detail: true // Will mount the route at the detail endpoint /movies/:id/athirdroute
  })
  .route('pshh', {
    handler: [function(req, res, next) {
      next();
    }, function(req, res, next) {
      next();
    }, function(req, res, next) {
      res.locals.status_code = 200;
      res.locals.bundle = {
        pshh: "called"
      };
      next();
    }],
    methods: ['get', 'post']
  })
  .before('post', noop) // before a POST, execute noop
  .after('post', noop)
  .before('put', noop)
  .after('put', noop)
  .after('recommend', after)
  .after('athirdroute', after);

var genre = app.genre = restful.model("genres", mongoose.Schema({
    name: { type: 'string', required: true }
  }));
genre.methods(['get', 'put', 'delete']);
genre.shouldUseAtomicUpdate = false;

var review = app.genre = restful.model("reviews", mongoose.Schema({
    body: { type: 'string', required: true },
    length: { type: Number, min: 0, required: true} // https://github.com/baugarten/node-restful/issues/116
  }));
review.methods(['get', 'put', 'delete']);

user.register(app, '/users');
movie.register(app, '/api/movies');
genre.register(app, '/api/genres');
review.register(app, '/api/reviews');

if (!module.parent) {
  app.listen(3000);
}

function noop(req, res, next) { next(); }
function after(req, res, next) {
  res.locals.bundle.after = 'called';
  next();
}

