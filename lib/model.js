var mongoose = require('mongoose'),
    Model = mongoose.Model,
    handlers = require('./handlers');

exports = module.exports = model;

var methods = ['get', 'post', 'put', 'delete'],
  endpoints = methods.concat(['all']),
  defaultroutes = ['schema'],
  lookup = {
    'get': 'index',
    'getDetail': 'show',
    'put': 'updated',
    'post': 'created',
    'delete': 'deleted'
  },
  valid_filters = {
    'limit': query('limit'),
    'skip': query('skip'),
    'offset': query('offset')
  };
function query(key) {
  return function(val, quer) { return quer[key](val); };
}

/**
 * Returns the model associated with the given name or
 * registers the model with mongoose
 */
function model() {
  var result = mongoose.model.apply(mongoose, arguments);
  if (1 === arguments.length) return result;

  result.routes = {};
  result.allowed_methods = { get: { detail: false } }; 
  result.update_options = {};
  result.delete_options = {};
  result.templateRoot = '';
  result.addDefaultRoutes();
  return result;
}

Model.methods = function(methods) {
  var self = this;
  if (!Array.isArray(methods)) {
    methods = [methods];
  }
  methods.forEach(function(meth) {
    delete self.routes[meth];
    if ('string' === typeof meth) {
      self.allowed_methods[meth] = {};
      self.allowed_methods[meth].detail = (meth !== 'get' && meth !== 'post');
    } else {
      if (!meth.method) throw new Error("Method object must have a method property");
      self.allowed_methods[meth.method] = meth;
      self.allowed_methods[meth.method].detail = (meth.method !== 'get' && meth.method !== 'post');
    }
  });
  this.addDefaultRoutes();
  return this;
};

['update', 'delete'].forEach(function(updateType) {
  Model[updateType] = function(updateprops) {
    this[updateType + '_options'] = updateprops;
    return this;
  };
});

Model.template = function(templatePath) {
  if (templatePath.substr(-1) == '/') {
    templatePath = templatePath.substr(0, templatePath.length - 1);
  }
  this.templateRoot = templatePath;
  return this;
};

/**
 * Adds the default routes for the HTTP methods and one to get the schema
 */
Model.addDefaultRoutes = function() {
  var self = this;
  methods.forEach(function(meth) {
    if (meth in self.allowed_methods) {
      self.allowed_methods[meth].handler = handlers[meth];
      self.route(meth, self.allowed_methods[meth]);
    } else {
      delete self.routes[meth];
    }
  });

  defaultroutes.forEach(function(route) {
    self.route(route, handlers[route]);
  });
  this.addSchemaRoutes();
};

Model.addSchemaRoutes = function() {
  var self = this;
  this.schema.eachPath(function(pathName, schemaType) {
    if (schemaType.options.type === 'ObjectId') {
      // Right now, getting nested models is the only operation supported
      ['get'].forEach(function(method) {
        self.route(pathName, [method] , {
          handler: handlers[method + 'Path'].call(self, pathName),
          detail: true
        });
      }); 
    }
  });
}

/**
 * Adds an internal route for a path and method or methods to a function
 *
 * @param {String|Object} path: absolute path (including method) or object of routes
 * @param {String|Function} method: the method to route to or the handler function
 * @param {Function} fn: The handler function
 * @return {Model} for chaining
 * @api public
 */
Model.route = function(path, method, fn) {
  if (1 === arguments.length && 'object' === typeof path) {
    for (var key in path) {
      this.route(key, path[key]);
    }
    return this;
  }
  path = path.replace(/\//g, /\./);
  var self = this,
      subPaths = path.split(/\./),
      route = this.routes,
      meths = methods;
  if (1 === subPaths.length && '' === subPaths[0]) {
    subPaths = [];
  }
  if (2 === arguments.length) {
    fn = method;
    if (!fn.methods && methods.indexOf(subPaths[subPaths.length - 1]) > -1) {
      meths = subPaths.splice(subPaths.length - 1, 1);
    } 
  } else {
    meths = [method];
  }

  subPaths.forEach(function(sub, i) {
    if (!route[sub]) route[sub] = {};
    route = route[sub];
  });

  if (fn) {
    if ({}.toString.call(fn) == '[object Function]') {
      fn = {
        handler: fn
      };
    }
    if (!Array.isArray(fn.before)) {
      fn.before = (fn.before) ? [fn.before] : [];
    }
    if (!Array.isArray(fn.after)) {
      fn.after = (fn.after) ? [fn.after] : [];
    }
    if (fn.methods) meths = fn.methods;
    meths.forEach(function(meth) { 
      route[meth] = merge(route[meth], fn);
    });
  }
  return this;
};

Model.before = function(path, method, fn) {
  if (2 == arguments.length) {
    return this.route(path, { before: method});
  }
  return this.route(path, method, { before: fn });
};

Model.after = function(path, method, fn) {
  if (2 == arguments.length) {
    return this.route(path, { after: method});
  }
  return this.route(path, method, { after: fn });
};

Model.registerRoutes = function(app, prefix, path, routeObj) {
  var self = this;
  for (var key in routeObj) {
    if (methods.indexOf(key) > -1 && routeObj[key].handler) {
      var handlerlist = [this.preprocess.bind(this)].concat(
          routeObj[key].before,
          [routeObj[key].handler.bind(this)], 
          routeObj[key].after, 
          [handlers.last]
        );
      if (routeObj[key].detail) {
        app[key](prefix + '/:id([0-9a-fA-F]{24})' + path , handlerlist);
      } else {
        // We are going to add a hack because if theres no path, GET requests 
        // can have an id or lack an id and we want to capture both.
        if (!path && key === 'get') {
          app[key](prefix + '/:id([0-9a-fA-F]{24}$)?', handlerlist);
        } else {
          app[key](prefix + path, handlerlist);
        }
      }
    } else {
      this.registerRoutes(app, prefix, path + '/' + key, routeObj[key]);
    }
  }
};

/**
 * Registers this model to the given app
 *
 * This includes registering endpoints for all the methods desired
 * in the model definition
 *
 */
Model.register = function(app, url) {
  this.registerRoutes(app, url, '', this.routes);
};

// Will I still support handle()? I think maybe for default routes it might be nice, but
// exposed via model.get, model.post, etc.
/*Model.prototype.handle = function(route, filters, data, callback) {
  if (arguments.length === 3) {
    callback = data;
    data = {};
  } else if (arguments.length === 2) {
    callback = filters; 
    filters = [];
    data = {};
  }
  route = route.replace(/\//g, /\./);
  data.format = 'js';
  var req = {
    url: route,
    filters: filters,
    body: data,
    format: 'js',
  } 
  var res = {
    writeHeader: function() { },
    write: function(ret) { callback(ret); },
    send: function() {},
  };
  this.send(route.split(/\./), req, res);
}

Model.prototype.send = function(routes, req, res, next) {
  var handler = this.routes;
  req.quer = this.filter(req.filters, req.body, req.query, this.Model.find({}));
  req.templatePath = this.template(routes, req.filters);
  routes.forEach(function(route) {
    if (route in handler) handler = handler[route];
    else if (!('all' in handler)) {
      handlers.respond(res, 404, handlers.respond404());
      handlers.last(req, res); 
    } 
  });
  if ('all' in handler) handler = handler.all;

  if ('function' === typeof handler) {
    return handler.call(this, req, res, next);
  } 

  handlers.respond(res, 404, handlers.respond404());
  handlers.last(req, res);
}*/

Model.filter = function(req, quer) {
  if (req.params.id) {
    return this.findById(req.params.id);
  }
  var filterableKey;
  for (filterableKey in req.body) {
    if (filterableKey in valid_filters) {
      quer = valid_filters[filterableKey](req.body[filterableKey], quer);
    }
  }
  for (filterableKey in req.query) {
    if (filterableKey in valid_filters) {
      quer = valid_filters[filterableKey](req.query[filterableKey], quer);
    }
  }
  return quer;
};

Model.preprocess = function(req, res, next) {
  req.body = req.body || {};
  req.query = req.query || {};
  req.quer = this.filter(req, this.find({}));
  if (!('locals' in res)) {
    res.locals = {};
  }
  res.locals.bundle = {};

  req.templatePath = resolveTemplate(req);
  next(); 
};

function haveOneModel(req) {
  return !!req.params.id;
}

function resolveTemplate(req) {
  var method = req.method.toLowerCase(),
    tmplName;
  if (methods.indexOf(method) > -1) {
    if (haveOneModel(req) && method === 'get') {
      method += 'Detail';
    }
    tmplName = lookup[method];
  }
  return tmplName;
}

/**
 * Merges a route with another function object
 * fn.before is called after the old before
 * fn.after is called before the old after
 * If fn.handler is specified, then route.handler is overwritten
 */
function merge(route, fn) {
  if (!route) return fn;
  var result = {};
  for (var key in route) {
    result[key] = route[key];
  }
  result.before = result.before.concat(fn.before);
  result.handler = fn.handler || result.handler;
  result.after = fn.after.concat(result.after);
  return result;
}
