
exports = module.exports = Router;

function Router(options) {
  this.map = {};
  this.models = [];
  this.map['get'] = this.schema;
}

Router.prototype.register = function(method, model) {
  this.models.push(model);
//  this.map[model.name][method] = getMethodGenerator(method)(model);
}

Router.prototype.dispatch = function(req, res, next) {
  var self = this;
  console.log(req);
}

Router.prototype.schema = function(req, res) {
  for (model in models) {
    res.send('/' + model.title + '/');
  }
}

Router.prototype.route = function(method, model, callbacks) {
  var method = method.toLowerCase()
    , callbacks = utils.flatten([].slice.call(arguments, 2));

  // ensure path was given
  if (!path) throw new Error('Router#' + method + '() requires a path');

  // create the route
  var route = new Route(method, path, callbacks, {
      sensitive: this.caseSensitive
    , strict: this.strict
  });

  // add it
  (this.map[method] = this.map[method] || []).push({
    model: callbacks 
  });
  return this;
}
