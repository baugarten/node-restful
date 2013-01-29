var mongoose = require('mongoose'),
    utils = require('connect').utils,
    EventEmitter = require('events').EventEmitter,
    handlers = require('./handlers');

exports = module.exports = Model 

var methods = ['get', 'post', 'put', 'delete'];
var defaultroutes = ['schema'];
// Regular expression that checks for hex value
var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");

/**
 * A new Model
 *
 */
function Model(model) {
  utils.merge(this, EventEmitter.prototype);
  var self = this;
  this.resourceName = model.title.toLowerCase();
  this.methods = {};
  model.methods.forEach(function(meth) {
    if ('string' === typeof meth) {
      self.methods[meth] = {};
    } else {
      if (!meth.type) throw new Error("Method object must have a type property");
      self.methods[meth.type] = meth;
    }
  });
  this.schema = model.schema;
  this.excludes = model.excludes;
  this.Obj = mongoose.model(this.resourceName, this.schema);
  
  this.version = model.version || false;
  this.baseurl = "/" + ((this.version !== false) ? this.version + '/' : '') + this.resourceName;
  this.detailurl = model.detailurl || this.baseurl + "/:" + this.resourceName + "_key/";

  this.update = (model.update ? model.update : {});
  this.delete = (model.delete ? model.delete : {});

  this.userroutes = model.routes || {};
  this.populateRoutes();
}

/**
 * Populates the default routes for CRUD operations and schema definition
 *
 * If a method is not included in the model definition, then no endpoint
 * is made for that method. If no methods are included in the model 
 * definition, then GET is made available by default
 */
Model.prototype.populateRoutes = function() {
  this.routes = {};

  this.addDefaultRoutes();
  this.addSchemaRoutes();
  this.addUserRoutes();
}

/**
 * Adds the default routes for the HTTP methods and one to get the schema
 */
Model.prototype.addDefaultRoutes = function() {
  var self = this;
  methods.forEach(function(meth) {
    if (meth in self.methods) {
      self.methods[meth].fn = handlers[meth];
      self.registerRoute(self.methods[meth], meth);
    }
  });

  defaultroutes.forEach(function(route) {
    self.registerRoute(handlers[route].call(self), '__all__', route);
  });
}

Model.prototype.addSchemaRoutes = function() {
  var self = this;
  this.schema.eachPath(function(pathName, schemaType) {
    if (schemaType.options.type === 'ObjectId') {
      // Right now, getting nested models is the only operation supported
      ['get'].forEach(function(method) {
        self.registerRoute(handlers[method + 'Path'].call(self, pathName), method, pathName);
      }); 
    }
  });
}

Model.prototype.addUserRoutes = function() {
  for (var route in this.userroutes) {
    var fn = this.userroutes[route],
        methods = ['__all__'],
        detail = false,
        self = this;
    if (! ('function' === typeof fn)) {
      detail = !!fn.detail; 
      fn = fn.handler;
      methods = fn.methods || ['get'];
    }
    methods.forEach(function(meth) {
      self.registerRoute(handlers.wrap(route + '.' + meth, detail, fn), meth, route);
    });
  };
}

Model.prototype.route = function(path, splitter) {
  var subPaths = path.split(splitter),
      route = this.routes;
  subPaths.forEach(function(sub, i) {
    if (!route[sub]) route[sub] = {};
    route = route[sub];
  });
  return route;
}

Model.prototype.registerRoute = function(fn, meth, path) {
  var route = this.routes;
  if (arguments.length === 3)  {
    path = path.replace(/\//g, /\./);
    route = this.route(path, /\./);
    path += '.' + meth;
  } else {
    path = meth;
  }
  if (fn.before) this.on('before.' + path, fn.before);
  if (fn.after) this.on('after.' + path, fn.after);
  route[meth] = ('function' === typeof fn) ? fn : fn.fn;
}

/**
 * Registers this model to the given app
 *
 * This includes registering endpoints for all the methods desired
 * in the model definition
 *
 */
Model.prototype.register = function(app) {
  var self = this;
  app.use(this.baseurl, function() { self.dispatch.apply(self, arguments); });
}

Model.prototype.dispatch = function(req, res, next) {
  var url = req.url.toLowerCase(),
      method = req.method.toLowerCase(),
      params = this.parseUrl(url),
      filters = params.filters,
      routes = params.routes,
      nextModel = params.next,
      handler = this.routes;
  req.url = params.url;

  req.quer = req.quer || mongoose.model(this.resourceName).find({});

  req.quer = this.filter(filters, req.quer);

  routes.forEach(function(route) {
    if (route in handler) handler = handler[route];
    else return handlers.respond(res, 404, handlers.respond404());
  });
  if (method in handler) handler = handler[method];
  else if ('__all__' in handler) handler = handler['__all__'];

  if ('function' === typeof handler) {
    return handler.call(this, req, res, next);
  }

  return handlers.respond(res, 404, handlers.respond404());
}

/**
 * Parses the url for a route and a filter
 *
 * Routes are custom endings representing user defined endpoints for specific models
 * Routes can also be automatically generated for foreign keys and nested models
 * Filters filter a queryset
 *
 * If no route is found, '' is returned
 * If no filters are found, [] is returned
 */
Model.prototype.parseUrl = function(url) {
  var filters = '',
      urlparts = url.split('/');

  if (urlparts[0] === '') {
    urlparts.splice(0, 1);
  }
  if (urlparts[urlparts.length - 1] === '') {
    urlparts.splice(urlparts.length - 1, 1);
  }

  filters = this.getFilters(urlparts[0]);
  if (filters.length > 0) urlparts.splice(0, 1);

  return {
    filters: filters,
    routes: urlparts,
    url: urlparts.join('/')
  };
}

/**
 * Returns an array of filters to be applied to the queryset
 * Right now it only checks if the filter is a hex id
 *
 * More ways of filtering to come
 */
Model.prototype.getFilters = function(filter) {
  if (checkForHexRegExp.test(filter)) {
    return [
      {key: '_id', val: filter},
    ]
  }
  return [];
}

/**
 * Filters the queryset based on the filter properties in the url
 * 
 * Returns the filtered queryset
 *
 * More advanced filtering to come
 */
Model.prototype.filter = function(filters, quer) {
  filters.forEach(function(filter) {
    if ('val' in filter) {
      quer = quer.where(filter.key, filter.val);
    }
  });
  return quer;
}
