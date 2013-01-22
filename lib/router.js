
var Resource = require('./model');

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
 * this.models is a list of resource titles, all at the highest level (regardless of nesting)
 */
Router.prototype.register = function(model, db) {
  var self   = this,
      name   = model.title.toLowerCase(),
      map    = []; // map is a list of resources in order i.e. highest level first

  if (model.hasOwnProperty('parent')) {
    model.parent = this.modelMap[model.parent]; // give resource its actual parent
  } else {
    model.parent = null;
  }
  model.baseurl = null;
  model.detailurl = null;
  var resource = new Resource(model, db);
  this.modelMap[name] = resource
  this.models.push(name);

  // Reconstruct the parent chain for nested models
  var res   = resource,
      chain = [];
  while (res.parent !== null) {
    res = res.parent;
    chain.push(res.resourceName);
  }
  chain.reverse();
  
  model.methods.forEach(function(method) {
    mapping = self.map[method];

    // Mappings are stored under:
    // this.map[method][resource][child][grandchild], etc.
    // Each of these entries is an obj, with the default fn in key __call__
    chain.forEach(function(resource) {
      mapping = mapping[resource];
    });

    mapping[name] = {};

    mapping[name]['__call__'] = resource.methodHandler(method);
  });
}

Router.prototype.dispatch = function(req, res, next) {
  var self   = this,
      method = req.method.toLowerCase(),
      url    = req.url.toLowerCase(),
      models = this.getModels(url);

  if (models == null) {
    throw "404";
  }

  var parent  = null
      fn      = this.map[method],
      params  = [];

  for (var i = 0; i < models.length; i++) {
    var name = models[i].title,
        par  = this.modelMap[name].parent;
    if (this.models.indexOf(name) >= 0 && ((!par && !parent) ||  par.resourceName == parent)) {
      parent = name;
      fn = fn[name];
      params.push(models[i].params);
    } else {
      throw "404";
    }
  }
  
  if (typeof fn == 'object') {
    fn = fn['__call__'];
  }
  fn(req, res, next, params);
}

Router.prototype.getModels = function(url) {
  var url_parts = url.split('/');
  
  // Remove the first because it will always be empty, and the last if its empty
  url_parts.splice(0,1);
  if (url_parts[url_parts.length-1] === '') {
    url_parts.splice(url_parts.length-1, 1);
  }
  var models = [];
  while (url_parts.length > 0) {
    var title = url_parts[0].toLowerCase();
    var id = '';

    if (url_parts.length > 1) {
      var id = this.parseId(url_parts[1]);
      if (!id) {
        throw "404";
      }
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

/**
 * Will support more robust id matching in future
 */
Router.prototype.parseId = function(id) {
  if (id == 'schema') {
    return id;
  }
  return parseInt(id);
}
