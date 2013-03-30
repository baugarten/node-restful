var model = require('./model'),
    handlers = require('./handlers'),
    mongoose = require('mongoose');

exports = module.exports = handlers;
exports.model = model;
exports.mongoose = mongoose;
