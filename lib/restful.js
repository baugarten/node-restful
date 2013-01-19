var connect = require('connect'),
    utils   = connect.utils,
    proto   = require('./application');

exports = module.exports = createApplication;

function createApplication(dbconfig) {
  var app = connect();
  utils.merge(app, proto);
  app.init(dbconfig);
  return app;
}

