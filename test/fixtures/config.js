var express = require('express'),
    connect = require('connect'),
    mongoose = require('mongoose'),
    moviesfix = require('./movies'),
    usersfix = require('./users'),
    restful = require('../../'),
    movieparams,
    userparams,
    app;

exports.app = app = express();
app.use(connect.bodyParser());
mongoose.connect('mongodb://localhost/unittest');

userparams = usersfix.register(app);
movieparams = moviesfix.register(app);

exports.movies = movieparams.movies;
exports.users = userparams.users;
exports.movie = movieparams.movie;
exports.user = userparams.user;
