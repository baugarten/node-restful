var mongoose = require('mongoose'),
    utils = require('connect').utils,
    handlers = require('./handlers');

exports = module.exports = Model 

var methods = ['get', 'post', 'put', 'delete'];
var routes = ['schema'];
// Regular expression that checks for hex value
var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");

/**
 * A new Model
 *
 */
function Model(model) {
  this.resourceName = model.title.toLowerCase();
  this.methods = Array.prototype.map.call(model.methods, 
    function(meth) { return meth.toLowerCase(); }
  );
  this.schema = model.schema;
  this.excludes = model.excludes;
  this.Obj = mongoose.model(this.resourceName, this.schema);
  
  this.version = model.version || false;
  this.baseurl = "/" + ((this.version !== false) ? this.version + '/' : '') + this.resourceName;
  this.detailurl = model.detailurl || this.baseurl + "/:" + this.resourceName + "_key/";

  this.update = (model.update ? model.update : {});
  this.delete = (model.delete ? model.delete : {});

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
}

/**
 * Adds the default routes for the HTTP methods and one to get the schema
 */
Model.prototype.addDefaultRoutes = function() {
  var self = this;
  methods.forEach(function(meth) {
    if (self.methods.indexOf(meth) > -1) {
      self.routes[meth] = handlers[meth].call(self);
    }
  });

  routes.forEach(function(route) {
    console.log("Adding route for " + route);
    self.routes[route] = handlers[route].call(self);
  });
}

Model.prototype.addSchemaRoutes = function() {
  var self = this;
  this.schema.eachPath(function(pathName, schemaType) {
    if (schemaType.options.type === 'ObjectId') {
      var subPaths = pathName.split(/\./),
          route = self.routes;
      subPaths.forEach(function(sub, i) {
        if (!route[sub]) route[sub] = {};
        route = route[sub];
      });
      // Right now, getting nested models is the only operation supported
      ['get'].forEach(function(method) {
        route[method] = handlers[method + "Path"].call(self, pathName);
      }); 
    }
  });
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
    else return handlers.respond404(res);
  });
  if (method in handler) handler = handler[method];
  if ('function' === typeof handler) {
    return handler.call(this, req, res, next);
  }

  return handlers.respond404(res);
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
