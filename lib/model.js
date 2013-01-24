var mongoose = require('mongoose'),
    utils = require('connect').utils;

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
  this.parent = model.parent;
  this.methods = Array.prototype.map.call(model.methods, 
    function(meth) { return meth.toLowerCase(); }
  );
  this.schema = model.schema;
  this.excludes = model.excludes;
  this.Obj = mongoose.model(this.resourceName, this.schema);
  
  // If there is no parent, just use root, othewise use their parents detailurl
  this.baseurl = this.parent ? this.parent.detailurl + this.resourceName : "/" + this.resourceName;
  this.detailurl = model.detailurl || this.baseurl + "/(?{<" + this.resourceName + "_key>)/";

  this.update = (model.update ? model.update : {});
  this.delete = (model.delete ? model.delete : {});
  this.insert = (model.insert ? model.insert : {});

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
  var self = this;
  this.routes = {};

  methods.forEach(function(meth) {
    if (self.methods.indexOf(meth) > -1 && meth in self.__proto__) {
      self.routes[meth] = self.__proto__[meth].call(self);
    }
  });

  routes.forEach(function(route) {
    self.routes[route] = self.__proto__[route].call(self);
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

/**
 *
 *
 */
Model.prototype.dispatch = function(req, res, next) {
  var url = req.url.toLowerCase(),
      method = req.method.toLowerCase(),
      params = this.parseUrl(url),
      filters = params.filters,
      route = params.route;

  // If we are recursively dispatching, then we are going to
  // filter the existing queryset. Else, filter this Model
  req.queryset = req.queryset || mongoose.model(this.resourceName).find({});

  req.queryset = this.filter(filters, req.queryset);
  if ((!route || route === '') && method in this.routes) {
    return this.routes[method].call(this, req, res, next);
  } else if (this.routes.hasOwnProperty(route)) {
    return this.routes[route].call(this, req, res, next);
  }
  respond(res, 404, {
    message: 'Page Not Found',
    name: "PageNotFound",
    errors: 'Endpoint not found for model ' + this.resourceName,
  });


}

/**
 * Parses the url for a route and a filter
 *
 * Routes are custom endings representing user defined endpoints for specific models
 * Filters filter a queryset
 *
 * If no route is found, '' is returned
 * If no filter is found, '' is returned
 */
Model.prototype.parseUrl = function(url) {
  var filters = '',
      route = '',
      urlparts = url.split('/');

  if (urlparts[0] === '') {
    urlparts.splice(0, 1);
  }
  if (urlparts[urlparts.length - 1] === '') {
    urlparts.splice(urlparts.length - 1, 1);
  }

  filters = this.getFilters(urlparts[0]);
  route = this.getRoute(urlparts[((filters !== '') ? 1 : 0)]); 
  return {
    filters: filters,
    route: route,  
  };
}

/**
 * Parses the url for a route property
 *
 * Routes are custom endings representing user defined endpoints for specific models
 */
Model.prototype.getRoute = function(url) {
  // haven't found a use for this yet
  return url;
}

/**
 * Returns an array of filters to be applied to the queryset
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
 * To be implemented
 */
Model.prototype.filter = function(filters, queryset) {
  filters.forEach(function(filter) {
    if ('val' in filter) {
      queryset = queryset.where(filter.key, filter.val);
    }
  });
  return queryset;
}

Model.prototype.schema = function() {
  var self = this;
  return function(req, res, next) {
    respond(res, 200, {
      resource: self.resourceName,
      fields: self.fields,
      methods: self.methods,
      GET: self.detailurl,
      POST: self.baseurl,
      PUT: self.detailurl,
      DELETE: self.detailurl,
    });
  }
}

Model.prototype.get = function() {
  var self = this;
  return function(req, res, next, params) {
    console.log("GET on " + self.resourceName);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    var query = req.queryset.find().lean().exec(function(a,list) {
      res.write(JSON.stringify(list));
      res.end();
    });
  }
}

Model.prototype.post = function() {
  var self = this;
  return function(req, res, next, params) {
    console.log("Called POST on " + self.resourceName);
    var obj = new self.Obj(req.body);
    obj.save(function(err) {
      respondOr400(res, err, 201, obj);
    });
  }
}
Model.prototype.put = function() {
  var self = this;
  return function(req, res, next, filters) {
    console.log("Called PUT on " + self.resourceName);
    self.requireOneModel(res, req.queryset, self.update, function() {
      req.queryset.findOneAndUpdate({}, req.body, self.update, function(err, newObj) {
        if (err) {
          return respond(res, 400, err);
        }
        if (!newObj) {
          objectNotFound(res);
        } else {
          respond(res, 200, newObj);
        }
        res.end();
      });
    });
  }
}
Model.prototype.delete = function() {
  var self = this;
  return function(req, res, next, params) {
    console.log("Called DELETE on " + self.resourceName);
    self.requireOneModel(res, req.queryset, self.delete, function() {
      req.queryset.findOneAndRemove({}, function(err, obj) {
        respondOr400(res, err, 200, {
          status: "OK"
        });
      });
    });
  }
}

/**
 * If the model requires a single matching object for the given method (update or delete)
 * then this method requires that there is only one matching model
 *
 * If there aren't, the callback is NOT called, and an error is written to the response.
 *
 */
Model.prototype.requireOneModel = function(res, query, options, callback) {
  var requireOneModel = 'sort' in options && !options.sort,
      // Make the haveOneModel more robust by checking all UNIQUE fields
      haveOneModel = ('id' in query._conditions); 

  if (requireOneModel && !haveOneModel) {
    query.count(function(err, count) {
      if (count > 1) {
        respond(res, 404, {
          message: 'Multiple Objects Found',
          name: 'MultipleObjectsFound',
          errors: {
            __all__: {
              message: "Multiple objects were found (forbidden in model declaration)"
            }
          }
        });
      } else if (count === 0) {
        objectNotFound(res);
      } else {
        callback(true);
      }
    });
  } else {
    callback(true);
  }
}

function objectNotFound(res) {
  respond(res, 404, {
    message: 'Object not found',
    name: 'ObjectNotFound',
    errors: {
      _id: {
        message: "Could not find object with specified attributes",
      }
    }
  });
}

/**
 * Takes a response, error, success statusCode and success payload
 *
 * If there is an error, it returns a 400 with the error as the payload
 * If there is no error, it returns statusCode with the specified payload
 *
 */
function respondOr400(res, err, statusCode, payload) {
  if (err) {
    respond(res, 400, err);
  } else {
    respond(res, statusCode, payload);
  }
}

function respond(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.write(JSON.stringify(payload));
  res.end();
}
