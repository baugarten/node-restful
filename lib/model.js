var mongoose = require('mongoose');

exports = module.exports = Model 

var methods = ['get', 'post', 'put', 'delete'];

/**
 * A resource exposed via the api
 * Handles internal routing and handling
 */
function Model(model) {
  this.resourceName = model.title.toLowerCase();
  this.title = model.title;
  this.parent = model.parent;
  console.log(model.methods);
  this.methods = Array.prototype.map.call(model.methods, 
    function(meth) { return meth.toLowerCase(); }
  );
  console.log(this.methods);
  this.fields = model.fields
  this.excludes = model.excludes;
  //
  // If there is no parent, just use root, othewise use their parents detailurl
  this.baseurl = this.parent ? this.parent.detailurl + this.resourceName : "/" + this.resourceName;
  this.detailurl = model.detailurl || this.baseurl + "/(?{<" + this.resourceName + "_key>)/";
  this.populateRoutes();
  mongoose.model(this.resourceName, model.schema);
}

Model.prototype.populateRoutes = function() {
  var self = this;
  this.routes = {};
  console.log("Model prototype");
  console.log(this.__proto__);
  console.log(this.__proto__['get']);
  methods.forEach(function(meth) {
    console.log(meth);
    if (self.methods.indexOf(meth) > -1 && meth in self.__proto__) {
      console.log("ADDING ROUTE")
      self.routes[meth] = self.__proto__[meth]();
    }
  });
  console.log(this.routes);
}

Model.prototype.register = function(app) {
  var self = this;
  console.log("Register " + this.baseurl);
  app.use(this.baseurl, function() { self.dispatch.apply(self, arguments); });
}


/**
 *
 *
 */
Model.prototype.dispatch = function(req, res, next) {
  var url = req.url.toLowerCase(),
      method = req.method.toLowerCase(),
      route = this.getRoute(url);

  // If we are recursively dispatching, then we are going to
  // filter the existing queryset. Else, filter this Model
  req.queryset = req.queryset || mongoose.model(this.resourceName);

  req.queryset = this.filter(url, req.queryset);

  console.log(this.routes);
  if (!route || route === '') {
    return this.routes[method].call(this, req, res, next);
  } else if (this.routes.hasOwnProperty(route)) {
    return this.routes[route].call(this, req, res, next);
  }
  next();
}

/**
 * Parses the url for a route property
 *
 * Routes are custom endings representing user defined endpoints for specific models
 */
Model.prototype.getRoute = function(url) {
  return "";
}

/**
 * Filters the queryset based on the filter properties in the url
 * 
 * Returns the filtered queryset
 */
Model.prototype.filter = function(url, queryset) {
  return queryset;
}

/**
 * There are differnet kind of get requests. We have 3:
 *    - Index request: get all items by some filtering or custom queryset
 *    - Detail request: get details on one item
 *    - Schema request: get the url schema for this resource
 * 
 */
Model.prototype.get = function() {
  var self = this;
  // params is a list of lists, each list is a list of params for nested
  // opjects. The highest level object is at index 0 
  return function(req, res, next, params) {
    if (params[params.length-1][0] == '') {
      return self.getindex.call(self, req, res, next, params);
    } else if (typeof params[params.length-1][0] == 'number') {
      return self.getdetail.call(self, req, res, next, params);;
    } else if (params[params.length-1][0] == 'schema') {
      return self.printSchema.call(self, req, res, next, params);
    } else {
      // Support for custom routes will come
      throw "404";
    }
  }
}

Model.prototype.printSchema = function(req, res, next, params) {
  res.write(JSON.stringify({
    resource: this.resourceName,
    fields: this.fields,
    methods: this.methods,
    GET: this.detailurl,
    POST: this.baseurl,
    PUT: this.detailurl,
    DELETE: this.detailurl,
  }));
  next();
}

Model.prototype.post = function() {
  var self = this;
  return function(req, res, next, params) {
    if (this.strict) {
      
    }
    res.write("called post on " + self.title);
    console.log(req);
    console.log(req.body);
    req.on("data", function(chunk) {
      console.log(chunk);
    });
    next();
  }
}
Model.prototype.put = function() {
  var self = this;
  return function(req, res, next, params) {
    res.write("called put on " + self.title);
    next();
  }
}
Model.prototype.delete = function() {
  var self = this;
  return function(req, res, next, params) {
    res.write("called delete on " + self.title);
    next();
  }
}
