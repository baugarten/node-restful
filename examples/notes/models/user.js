var restful = require('../../..'),
    mongoose = require('mongoose');

var User = new restful.Model({
  title: 'user',
  methods: ['get', 'post', 'put', 'patch', 'delete'],
  schema: mongoose.Schema({
    username: 'string',
    password: 'string',
  }),
});

exports = module.exports = User;
