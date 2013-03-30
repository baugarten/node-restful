var mongoose = require('mongoose'),
    Model = mongoose.Model,
    handlers = require('./handlers');

exports = module.exports = Model;
exports.model = model;

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
 * A new Model
 *
 *
function Model(model) {
  var self = this;

  this.modelName = model.title.toLowerCase(); 
  if (!this.modelName) throw new Error("Need a resource name");

  this.methods = {};
  model.methods.forEach(function(meth) {
    if ('string' === typeof meth) {
      self.methods[meth] = {};
      self.methods[meth].detail = (meth !== 'get' && meth !== 'post');
    } else {
      if (!meth.type) throw new Error("Method object must have a type property");
      self.methods[meth.type] = meth;
      self.methods[meth.type].detail = (meth.type !== 'get' && meth.type !== 'post');
    }
  });
  this.schema = model.schema;
  if (!this.schema) throw new Error("Model needs a schema");

  this.Model = mongoose.model(this.modelName, this.schema);

  this.update = model.update || {};
  this.delete = model.delete || {};

  this.templateRoot = model.template || '';
  if (this.templateRoot.substr(-1) == '/') {
    this.templateRoot = this.templateRoot.substr(0, this.templateRoot.length - 1);
  }

  this.populateRoutes(model.routes || {});
}*/

Model.new = function(model) {
  return new this(model);
}

/**
 * Populates the default routes for CRUD operations and schema definition
 *
 * If a method is not included in the model definition, then no endpoint
 * is made for that method. If no methods are included in the model 
 * definition, then GET is made available by default
 */
Model.populateRoutes = function(customroutes) {
  //this.routes = {};

  this.addDefaultRoutes();
  this.addUserRoutes(customroutes);
}

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

Model.addUserRoutes = function(userroutes) {
  for (var route in userroutes) {
    this.route(route, userroutes[route]);
  }
};

Model.route = function(path, method, fn) {
  path = path.replace(/\//g, /\./);
  var self = this,
      subPaths = path.split(/\./),
      route = this.routes,
      meths = ['all'];
  if (1 === subPaths.length && '' === subPaths[0]) {
    subPaths = [];
  }
  if (2 === arguments.length) {
    fn = method;
    if (!fn.methods && methods.indexOf(subPaths[subPaths.length - 1]) > -1) {
      meths = [subPaths.splice(subPaths.length - 1, 1)];
    }
  } else {
    meths = [method];
  }

  subPaths.forEach(function(sub, i) {
    if (!route[sub]) route[sub] = {};
    route = route[sub];
  });

  if (fn) {
    if (fn && {}.toString.call(fn) == '[object Function]') {
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
      route[meth] = fn;
    });
  }
  return route;
};

Model.userroute = function(route, fn) {
  if (arguments.length === 1) {
    this.addUserRoutes(route);
  } else {
    this.route(route, fn);
  }
  return this;
};

Model.registerRoutes = function(app, prefix, path, routeObj) {
  var self = this;
  for (var key in routeObj) {
    if (endpoints.indexOf(key) > -1) {
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
  var self = this;
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

Model.resolveTemplate = function(req) {
  var method = req.method.toLowerCase(),
    tmplName;
  if (methods.indexOf(method) > -1) {
    if (this.haveOneModel(req) && method === 'get') {
      method += 'Detail';
    }
    tmplName = lookup[method];
  }
  return tmplName;
};

Model.haveOneModel = function(req) {
  return !!req.params.id;
};

Model.preprocess = function(req, res, next) {
  req.body = req.body || {};
  req.query = req.query || {};
  req.quer = this.filter(req, this.find({}));

  req.templatePath = this.resolveTemplate(req);
  next(); 
};
