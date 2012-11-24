
var Resource = require('./resource');

exports = module.exports = Router;

function Router(options) {
  this.map = {};
  this.models = [];
  this.modelMap = {};

  this.map['get'] = {};
  this.map['post'] = {};
  this.map['put'] = {};
  this.map['delete'] = {};
}

/**
 * Register a new model
 *
 * this.models is a list of objects, each object has a key that is
 *             the name of the resource and its value is an array of 
 *             resources that are nested under it
 */
Router.prototype.register = function(model) {
  var self   = this,
      name   = model.title.toLowerCase(),
      models = this.models,
      map    = []; // map is a list of resources in order i.e. highest level first

  this.modelMap[name] = new Resource(model);
  var resource = this.modelMap[name];

  this.models.push(name);

  var res   = resource,
      chain = [];
  while (res.parent !== null) {
    console.log("push " + res.title);
    chain.push(res.parent);
    res = self.modelMap[res.parent];
  }
  chain.reverse();
  
  model.methods.forEach(function(method) {
    mapping = self.map[method];
    chain.forEach(function(resource) {
      mapping = mapping[resource];
    });

    mapping[name] = {};

    mapping[name]['__call__'] = resource.methodHandler(method);
  });
  console.log(this.map);
}

Router.prototype.findModel = function(models, title, prevs) {
  var self = this,
      hierarchy = null;
  models.forEach(function(model) {
    if (model.hasOwnProperty(title)) {
      prevs.push(title);
      hierarchy = {
        models: model[title],
        map: prevs,
      }
      return true;
    } else {
      for (var prop in model) {
        tmp = self.findModel(model[prop], title, prevs.concat([prop]));
        if (null !== tmp) {
          hierarchy = tmp;
          return true;
        }
      }
    }
  });
  return hierarchy;
}

Router.prototype.dispatch = function(req, res, next) {
  var self   = this,
      method = req.method.toLowerCase(),
      url    = req.url.toLowerCase(),
      models = this.getModel(url),
      args   = {};

  console.log("Dispatch");
  console.log(models);
  var parent  = null,
      fn      = this.map[method],
      params  = [];
  for (var i = 0; i < models.length; i++) {
    var name = models[i].title
    if (this.models.indexOf(name) >= 0 && this.modelMap[name].parent == parent) {
      parent = name;
      fn = fn[models[i].title];
      params.push(models[i].params);
    } else {
      throw "Illegal nesting of models";
    }
  }
  
  // Sometimes a resource will have nested resources so its map ends in a dict. In that case
  // We move the default handler of the method on the object to __call__
  console.log("Found fn");
  console.log(fn);
  if (typeof fn == 'object') {
    fn = fn['__call__'];
  }
  console.log(fn.toString());
  fn(req, res, next, params);
}

Router.prototype.getModel = function(url) {
  // Should support nested models by returning an array of models
  console.log(url);
  var url_parts = url.split('/');
  // Remove the first because it will always be empty, and the last if its empty
  url_parts.splice(0,1);
  if (url_parts[url_parts.length-1] === '') {
    url_parts.splice(url_parts.length-1, 1);
  }
  console.log(url_parts);
  var models = [];
  while (url_parts.length > 0) {
    var title = url_parts[0].toLowerCase();
    var id = "";

    if (url_parts.length > 1) {
      var id = parseInt(url_parts[1]);
      url_parts.splice(0, 2);
    } else {
      url_parts.splice(0, 1);
    }
    models.push({
      title: title,
      params: [ id ],
    });
  }
  return models;
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
