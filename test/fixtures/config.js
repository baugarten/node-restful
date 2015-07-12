var express = require('express'),
    fixtures = require('pow-mongodb-fixtures'),
    app = require('../../examples/movies/'),
    data = require('./data'),
    done = false,
    mongoose,
    callback;


exports.app = app;
exports.movie = app.movie;
exports.user = app.user;
mongoose = app.mongoose;
fixtures = fixtures.connect(mongoose.connection.name);

fixtures.load(data, function(err) {
  exports.users = data.users;
  exports.movies = data.movies;
  done = true;
  if (callback) return callback();
});

exports.movies = data.movies;
exports.users = data.users;

exports.ready = function(cb) {
  callback = cb; 
  if (done) callback();
};
