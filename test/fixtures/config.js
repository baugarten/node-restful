var moviesfix = require('./movies'),
    usersfix = require('./users'),
    restful = require('../../'),
    movieparams,
    userparams,
    app;

exports.app = app = restful({
  hostname: 'localhost',
  db: 'testing', 
});

userparams = usersfix.register(app);
movieparams = moviesfix.register(app);

exports.movies = movieparams.movies;
exports.users = userparams.users;
exports.movie = movieparams.movie;
exports.user = userparams.user;
