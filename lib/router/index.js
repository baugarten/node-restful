
exports = module.exports = Router;

function Router(options) {
  this.map = {};
  this.models = [];

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

  // We change the routing if it is a nested model
  if (model.hasOwnProperty('parent')) {
    modelHierarchy = this.findModel(this.models, model.parent.toLowerCase(), []);
    models = modelHierarchy.models;
    map = modelHierarchy.map;
    console.log("Map");
    console.log(map);
  }
  
  obj = {};
  obj[name] = [];
  models.push(obj);
  
  model.methods.forEach(function(method) {
    mapping = self.map[method];

    map.forEach(function(resource) {
      mapping = mapping[resource];
    });

    mapping[name] = {};

    mapping[name]['__call__'] = function(req, res, next, params) {
      res.write("Called " + method + " on " + name);
      res.end();
    }
  });
}

Router.prototype.findModel = function(models, title, prevs) {
  var self = this,
      hierarchy = null;
  console.log("FindModel");
  console.log(models);
  console.log(title);
  models.forEach(function(model) {
    if (model.hasOwnProperty(title)) {
      console.log("found property");
      console.log(model[title]);
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

Router.prototype.containsModel = function(models, title) {
  var found = null
  models.forEach(function(model) {
    if (model.hasOwnProperty(title)) {
      found = model[title];
      return true;
    } 
  });
  return found;
}

Router.prototype.dispatch = function(req, res, next) {
  var self   = this,
      method = req.method.toLowerCase(),
      url    = req.url.toLowerCase(),
      models = this.getModel(url),
      args   = {};

  console.log("Dispatch");
  console.log(models);
  var modelList = this.models,
      fn        = this.map[method],
      params    = [];
  for (var i = 0; i < models.length; i++) {
    console.log(fn);
    var modelList = this.containsModel(modelList, models[i].title);
    if (modelList !== null) {
      fn = fn[models[i].title];
      params = models[i].params;
    } else {
      throw "Illegal nesting of models";
    }
  }
  
  // Sometimes a resource will have nested resources so its map ends in a dict. In that case
  // We move the default handler of the method on the object to __call__
  if (typeof fn == 'object') {
    fn = fn['__call__'];
  }
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
