var connect = require('connect'),
    Router = require('./router'),
    http   = require('http'),
    mongoose = require('mongoose'),
    Model = require('./model');

var app = exports = module.exports = {};

app.init = function(dbconfig) {
  var self = this;
  console.log("Init App");
  this.cache = {};
  this.defaultConfiguration();
  this.models = {}; // Key value from model identifier to resource
  mongoose.connect(get_mongo_uri(dbconfig), function(err, db) {
    console.log(err); 
  });
}

function get_mongo_uri(dbconfig) {
  dbconfig.hostname = (dbconfig.hostname || 'localhost');
  dbconfig.port = (dbconfig.port || 27017);
  dbconfig.db = (dbconfig.db || 'test');

  if(dbconfig.username && dbconfig.password){
    return "mongodb://" + dbconfig.username + ":" + dbconfig.password + "@" + dbconfig.hostname + ":" + dbconfig.port + "/" + dbconfig.db;
  }
  else{
    return "mongodb://" + dbconfig.hostname + ":" + dbconfig.port + "/" + dbconfig.db;
  }
}

app.defaultConfiguration = function() {
  this._router = new Router(this);
  this.use(connect.query());
  this.use(connect.bodyParser());
  this.use(connect.methodOverride());
}

app.use = function(route, fn){
  var app;

  // default route to '/'
  if ('string' != typeof route) fn = route, route = '/';

  // express app
  if (fn.handle && fn.set) app = fn;

  // restore .app property on req and res
  if (app) {
    app.route = route;
    fn = function(req, res, next) {
      var orig = req.app;
      app.handle(req, res, function(err){
        req.app = res.app = orig;
        req.__proto__ = orig.request;
        res.__proto__ = orig.response;
        next(err);
      });
    };
  }

  connect.proto.use.call(this, route, fn);

  // mounted an app
  if (app) {
    app.parent = this;
    app.emit('mount', this);
  }

  return this;
};

app.register = function(model) {
  var self = this,
      name = model.title.toLowerCase();
  // Detault is read only
  if (!model.methods) { 
    model.methods = ['get']; 
  }
  // Give the model its real parent if it asks for it
  if (model.hasOwnProperty('parent')) {
    var parent = model.parent.toLowerCase();
    if (this.models.hasOwnProperty(parent)) {
      model.parent = this.models[model.parent.toLowerCase()];
    } else {
      throw "No registered model by name " + parent + ".\nMake sure you register the parent before " + name + " and spelled everything correctly";
    }
  } else {
    model.parent = null
  }
  this.models[name] = new Model(model);
  this.models[name].register(this);
}

app.listen = function() {
  var server = http.createServer(this);
  return server.listen.apply(server, arguments);
}
