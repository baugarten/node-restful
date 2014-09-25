express = require('express')
fixtures = require('pow-mongoose-fixtures')
app = require('../../examples/movies/')
data = require('./data')
done = false
callback = null

exports.app = app
exports.movie = app.movie
exports.user = app.user

mongoose = app.mongoose

fixtures.load { users: [], movies: [] }, mongoose.connection, (err) ->
  done = true
  callback() if (callback)

exports.ready = (cb) ->
  callback = cb
  callback() if (done)

