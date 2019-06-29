var express = require('express'),
    fixtures = require('pow-mongodb-fixtures'),
    app = require('../../../examples/books/'),
    data = require('./data'),
    done = false,
    mongoose,
    callback;


exports.app = app;
exports.movies = app.movies;
mongoose = app.mongoose;
fixtures = fixtures.connect(mongoose.connection.name);

fixtures.load(data, function(err) {
  exports.movies = data.movies;
  done = true;
  if (callback) return callback();
});

exports.movies = data.movies;

exports.ready = function(cb) {
  callback = cb; 
  if (done) callback();
};
