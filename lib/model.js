var mongoose = require('mongoose'),
    Model = mongoose.Model,
    handlers = require('./handlers');

exports = module.exports = model;

var methods = ['get', 'post', 'put', 'delete'], // All HTTP methods, PATCH not currently supported
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
  },
  defaults = function() {
    return {
      routes: {},
      allowed_methods: { 
        get: { detail: false } 
      },
      update_options: {},
      delete_options: {},
      templateRoot: ''
    };
  };

/**
 * Returns the model associated with the given name or
 * registers the model with mongoose
 */
function model() {
  var result = mongoose.model.apply(mongoose, arguments),
      default_properties = defaults();
  if (1 === arguments.length) return result;

  for (var key in default_properties) {
   result[key] = default_properties[key];
  }
  result.addDefaultRoutes();

  return result;
}

Model.methods = function(newmethods) {
  var self = this;

  methods.forEach(function(method) {
    delete self.routes[method];
  });

  this.allowed_methods = [];
  if (!Array.isArray(newmethods)) {
    newmethods = [newmethods];
  }
  newmethods.forEach(function(meth) {
    var method = meth.method;
    if ('string' === typeof meth) {
      method = meth; 
      meth = {};
    }
    if (!method) throw new Error("Method object must have a method property");
    self.allowed_methods.push(method);

    meth.handler = handlers[method];
    meth.detail = (method !== 'get' && method !== 'post');
    self.route(method, normalizeHandler(meth));
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
  this.route('schema', handlers.schema); // This is invalid because we don't have all 
                                         // of the routes at this point. The schema route 
                                         // should be generated when registering
  this.addSchemaRoutes();
};

Model.addSchemaRoutes = function() {
  var self = this;
  this.schema.eachPath(function(pathName, schemaType) {
    if (schemaType.options.type === 'ObjectId') {
      // Right now, getting nested models is the only operation supported
      ['get'].forEach(function(method) {
        self.route(pathName, method , {
          handler: handlers[method + 'Path'].call(self, pathName),
          detail: true
        });
      }); 
    }
  });
};

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
  var route = getRoute(this.routes, path),
      meths = methods, // Default to all methods
      lastPath = path.substr(path.lastIndexOf('.') + 1);

  if (2 === arguments.length) {
    fn = method;
    if (!fn.methods && methods.indexOf(lastPath) > -1) {
      meths = [lastPath];
    } 
  } else {
    meths = [method];
  }

  if (fn) {
    fn = normalizeHandler(fn);

    meths.forEach(function(meth) { 
      route[meth] = merge(route[meth], fn);
    });
  }
  return this;
};

Model.before = function(path, method, fn) {
  if (2 == arguments.length) {
    arguments[1] = { before: arguments[1] };
  }
  return this.route.apply(this, arguments);
};

Model.after = function(path, method, fn) {
  if (2 == arguments.length) {
    arguments[1] = { after: arguments[1] };
  }
  return this.route.apply(this, arguments);
};

/**
 * Registers all of the routes in routeObj to the given app
 *
 * TODO(baugarten): refactor to make less ugly
 *
 * if (isEndpoint(routeObj, path)) { handleRegistration(app, prefix, path, routeObj); }
 * else {
 *   for (var key in routeObj) { recurse }
 * }
 */
Model.registerRoutes = function(app, prefix, path, routeObj) {
  for (var key in routeObj) {
    if (isEndpoint(routeObj, key)) { //methods.indexOf(key) > -1 && routeObj[key].handler) {
      var handlerlist = [preprocess.bind(this)].concat(
          routeObj[key].before,
          [routeObj[key].handler.bind(this)], 
          routeObj[key].after, 
          [handlers.last]
        );
      /**
       * TODO(baugarten): Add an enum type-thing to specify detail route, detail optional or list 
       * aka prettify this
       */
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

/**
 * Returns a query filtered by the data in the request
 * Looks in req.body and req.query to get the filterable data
 * Filters the query based on functions in valid_filters
 */
Model.filter = function(req, quer) {
  if (req.params.id) {
    return this.findById(req.params.id);
  }
  var filterableKey;
  [req.body, req.query].forEach(function(filterableData) {
    Object.keys(filterableData).filter(function(potential_filter) {
      return potential_filter in valid_filters;
    }).forEach(function(valid_key) {
      quer = valid_filters[valid_key](filterableData[valid_key], quer);
    });
  });
  return quer;
};

function preprocess(req, res, next) {
  req.body = req.body || {};
  req.query = req.query || {};
  req.quer = this.filter(req, this.find({}));
  if (!('locals' in res)) {
    res.locals = {};
  }
  res.locals.bundle = {};

  req.templatePath = resolveTemplate(req);
  next(); 
}

function query(key) {
  return function(val, query) { return query[key](val); };
}

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

  route.before = route.before.concat(fn.before);
  route.handler = fn.handler || route.handler;
  route.after = fn.after.concat(route.after);
  return route;
}

function getRoute(routes, path) {
  path = path.replace(/\//g, /\./).split(/\./);
  if (1 === path.length && '' === path[0]) { // we got the empty string
    path = [];
  }
  if (methods.indexOf(path[path.length - 1]) > -1) {
    path.splice(path.length - 1, 1);
  }
  path.forEach(function(sub, i) {
    if (!routes[sub]) routes[sub] = {};
    routes = routes[sub];
  });
  return routes; 
}

function normalizeHandler(fn) {
  var result = {};
  result.handler = fn.handler;
  result.detail = fn.detail;
  if ({}.toString.call(fn) == '[object Function]') {
    result = {
      handler: fn
    };
  }
  ['before', 'after'].forEach(function(hook) {
    result[hook] = fn[hook] || [];
    if (!Array.isArray(result[hook])) {
      result[hook] = [ result[hook] ];
    }
  });
  return result;
}

function isEndpoint(route, method) {
  return methods.indexOf(method) > -1 && route[method].handler;
}
