var connect = require('connect'),
    utils   = connect.utils,
    proto   = require('./application'),
    Model   = require('./model');

exports.create = createApplication;

exports.Model = Model;

function Restful() {
  this._models = {};
}

function createApplication(dbconfig) {
  var app = connect();
  utils.merge(app, proto);
  app.init(dbconfig);
  return app;
}


