var Model = require('./model'),
    handlers = require('./handlers'),
    mongoose = require('mongoose');

exports = module.exports = handlers;
exports.Model = Model;
exports.mongoose = mongoose;
