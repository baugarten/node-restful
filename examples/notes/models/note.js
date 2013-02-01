var restful = require('../../../'),
    mongoose = require('mongoose'),
    User = require('./user');

var validateUser = function(req, res, next) {
  console.log("Add User");
  if (req.body.creator) {
    User.Obj.findById(req.body.creator, function(err, model) {
      if (!model) {
        return next(restful.objectNotFound());
      }
      next();
    });
  } 
  next(); // Required, so error later
}

var Note = new restful.Model({
  title: "note",
  methods: ['get', 'delete', { type: 'post', before: validateUser }, { type: 'put', before: validateUser }],
  schema: mongoose.Schema({
    title: { type: 'string', required: true},
    body: { type: 'string', required: true},
    creator: { type: 'ObjectId', ref: 'user', require: true},
  }),
});

exports = module.exports = Note;
