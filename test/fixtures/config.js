var express = require('express'),
    fixtures = require('mongoose-fixtures'),
    mongoose = require('mongoose'),
    moviesfix = require('./movies'),
    usersfix = require('./users'),
    restful = require('../../'),
    app = require('../../examples/movies/'),
    data = require('./data'),
    done = false,
    callback;


exports.app = app;
exports.movie = app.movie;
exports.user = app.user;
mongoose = app.mongoose;

fixtures.load(data, mongoose.connection, function(err) {
  exports.user.find({}, function(err, userslist) {
    exports.users = userslist;
    exports.movie.find({}, function(err, movieslist) {
      exports.movies = movieslist;
      done = true;
      if (callback) return callback();
    });
  });
});


//exports.app = app = express();

exports.movies = data.movies;
exports.users = data.users;

exports.ready = function(cb) {
  callback = cb; 
  if (done) callback();
};

/*
app.use(express.bodyParser());
app.use(express.query());

app.set('view engine', 'jade');
mongoose.connect('mongodb://localhost/unittest2');

userparams = usersfix.register(app);
movieparams = moviesfix.register(app);

exports.movies = movieparams.movies;
exports.users = userparams.users;
exports.movie = movieparams.movie;
exports.user = userparams.user;
*/
