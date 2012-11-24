
var connect = require('connect'),
    Router = require('./router'),
    http   = require('http'),
    fields = require('./fields');

var app = exports = module.exports = {};

app.init = function() {
  this.cache = {};
  this.defaultConfiguration();
  this.fields = fields;
}

app.defaultConfiguration = function() {
  this._router = new Router(this);
}

app.handle = function(req, res, next) {
  try {
    this._router.dispatch(req, res, next); 
  } catch (err) {
    if (err == '404') {
      res.writeHead(404, {'Content-Type': 'application/json'});
      res.write(JSON.stringify({
        error: 'Page not found',
      }));
    }
    if (err == '500') {
      res.writeHead(500, {'Content-Type': 'application/json'});
      res.write(JSON.stringify({
        error: 'Internal Server Error',
      }));
    }
  }
}

app.register = function(model) {
  var self = this;

  if (!model.methods) { 
    // Detault is read only
    model.methods = ['get']; 
  }
  self._router.register(model, this.use);
}

/* From express */
app.use = function(route, fn){
  console.log(fn);
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

app.listen = function() {
  var server = http.createServer(this);
  return server.listen.apply(server, arguments);
}
