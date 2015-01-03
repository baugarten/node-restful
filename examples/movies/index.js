var express = require('express'),
    mongoose = require('mongoose'),
    restful = require('../../');
var app = module.exports = express();

app.use(express.bodyParser());
app.use(express.query());
app.use(restful);
app.set('view engine', 'jade');

app.mongoose = mongoose; // used for testing

mongoose.connect("mongodb://localhost/movies_test")

var userSchema = mongoose.Schema({
    username: { type: 'string', required: true },
    pass_hash: { type: 'number', required: true }
  });

var userResource = app.user = restful.resource('users', userSchema)
  .withRoutes(['list', 'detail', 'update', 'create', 'destroy'])
  .register()

var movieSchema = app.movie = mongoose.Schema({
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
  });

var movieResource = app.movie = restful.resource('movies', movieSchema);
movieResource
  .withRoutes(['list', 'detail', 'update', 'create', 'destroy'])
  //.baseUrl('api/movies')
  .route('recommend', function(req, cb) {
    console.log("Recommending!\n\n");
    cb({
      statusCode: 200,
      body: "called"
    });
  })
  .route('anotherroute', function(req, cb) {
    res.writeHead(200, {'Content-Type': 'application/json' });
    cb({
      statusCode: 200,
      body: JSON.stringify({
        anotherroute: "called"
      })
    })
  })
  .route('athirdroute', ["get", "post"], true, function(req, cb) {
    cb({
      statusCode: 200,
      body: {
        athirdroute: "called" // And response data
      }
    });
  })
  .before('', 'post', false, noop) // before a POST, execute noop
  .before('', 'get', true, noop)
  .after('', 'post', false, noop)
  .after('', 'get', true, noop)
  .before('', 'put', true, noop)
  .after('', 'put', true, noop)
  .after('recommend', 'get', false, after)
  .after('athirdroute', ['get', 'post'], true, after)
  .register();


app.listen(3000);

function noop(req, res, next) {
  next();
}
function after(req, res, next) {
  console.log("AFTER");
  res.locals.bundle.after = 'called';
  next();
}
