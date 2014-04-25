var express = require('express'),
    mongoose = require('mongoose'),
    restful = require('../../');
var app = module.exports = express();

app.use(express.bodyParser());
app.use(express.query());
app.use(restful);
app.set('view engine', 'jade');

app.mongoose = mongoose; // used for testing

mongoose.connect("mongodb://localhost/movies_test");

var user = mongoose.model('users', mongoose.Schema({
    username: { type: 'string', required: true },
    pass_hash: { type: 'number', required: true }
  }));

var userResource = app.user = restful.resource('users')
  .methods(['get', 'post', 'put', 'delete'])
  .setRemoveOptions({
    sort: 'field -username'
  });


var movie = app.movie = mongoose.model("movies", mongoose.Schema({
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
  }));

var movieResource = app.movie = restful.resource('movies');
movieResource.methods([
    'get',
    'post',
    'put',
    'delete'])
  .baseUrl('api/movies')
  .route('recommend', function(req, res, next) {
    console.log("Recommending!\n\n");
    res.locals.status_code = 200;
    res.locals.bundle.recommend = 'called';
    console.log(next);
    next();
  })
  .route('anotherroute', function(req, res, next) {
    res.writeHead(200, {'Content-Type': 'application/json' });
    res.write(JSON.stringify({
      anotherroute: "called"
    }));
    res.end(); // This ends the request and prevents any after filters from executing
  })
  .route('athirdroute', ["get", "post"], true, function(req, res, next) {
    res.locals.status_code = 200; // Store response status code
    res.locals.bundle = {
      athirdroute: "called" // And response data
    };
    next(); // Call *after* filters and then return the response
  })
  .before('', 'post', noop) // before a POST, execute noop
  .before('', 'get', noop)
  .after('', 'post', noop)
  .after('', 'get', noop)
  .before('', 'put', noop)
  .after('', 'put', noop)
  .after('recommend', after)
  .after('athirdroute', after);
userResource.register();
movieResource.register();


if (!module.parent) {
  app.listen(3000);
}

function noop(req, res, next) {
  next();
}
function after(req, res, next) {
  console.log("AFTER");
  res.locals.bundle.after = 'called';
  next();
}
