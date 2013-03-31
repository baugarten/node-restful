var express = require('express'),
    fixtures = require('mongoose-fixtures'),
    app = require('../../examples/movies/'),
    data = require('./data'),
    done = false,
    mongoose,
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

exports.movies = data.movies;
exports.users = data.users;

exports.ready = function(cb) {
  callback = cb; 
  if (done) callback();
};
