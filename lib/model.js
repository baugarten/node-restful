var mongoose = require('mongoose');

exports = module.exports = Model 

var methods = ['get', 'post', 'put', 'delete'];
var routes = ['schema'];

/**
 * A resource exposed via the api
 * Handles internal routing and handling
 */
function Model(model) {
  this.resourceName = model.title.toLowerCase();
  this.title = model.title;
  this.parent = model.parent;
  this.methods = Array.prototype.map.call(model.methods, 
    function(meth) { return meth.toLowerCase(); }
  );
  this.fields = model.fields
  this.excludes = model.excludes;
  //
  // If there is no parent, just use root, othewise use their parents detailurl
  this.baseurl = this.parent ? this.parent.detailurl + this.resourceName : "/" + this.resourceName;
  this.detailurl = model.detailurl || this.baseurl + "/(?{<" + this.resourceName + "_key>)/";
  this.populateRoutes();

  this.Obj = mongoose.model(this.resourceName, model.schema);
}

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
      filter = params.filter,
      route = params.route;

  console.log("Filter and Route");
  console.log(filter);
  console.log(route);
  // If we are recursively dispatching, then we are going to
  // filter the existing queryset. Else, filter this Model
  req.queryset = req.queryset || mongoose.model(this.resourceName);

  req.queryset = this.filter(filter, req.queryset);

  if (!route || route === '') {
    return this.routes[method].call(this, req, res, next);
  } else if (this.routes.hasOwnProperty(route)) {
    return this.routes[route].call(this, req, res, next);
  }
  next();
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
  var filter = '',
      route = '',
      urlparts = url.split('/');

  if (urlparts[0] === '') {
    urlparts.splice(0, 1);
  }
  if (urlparts[urlparts.length - 1] === '') {
    urlparts.splice(urlparts.length - 1, 1);
  }

  filter = this.getFilter(urlparts[0]);
  route = this.getRoute(urlparts[((filter !== '') ? 1 : 0)]); 
  return {
    filter: filter,
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
Model.prototype.getFilter = function(filter) {
  var id = parseInt(filter);
  if (isNaN(id)) {
    return '';
  }
  return [
    {id: id},
  ]
}

/**
 * Filters the queryset based on the filter properties in the url
 * 
 * Returns the filtered queryset
 *
 * To be implemented
 */
Model.prototype.filter = function(filters, queryset) {
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
  return function(req, res, next, params) {
    console.log("GET on " + self.resourceName);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    var query = req.queryset.find().lean().exec(function(a,list) {
      res.write(JSON.stringify(list));
      res.end();
    });
  }
}

Model.prototype.schema = function() {
  var self = this;
  return function(req, res, next) {
    res.write(JSON.stringify({
      resource: self.resourceName,
      fields: self.fields,
      methods: self.methods,
      GET: self.detailurl,
      POST: self.baseurl,
      PUT: self.detailurl,
      DELETE: self.detailurl,
    }));
    res.end();
  }
}

Model.prototype.post = function() {
  var self = this;
  return function(req, res, next, params) {
    res.write("called post on " + self.title);
    var obj = new self.Obj(req.body);
    obj.save(function(err) {
      if (err) { console.log("ERRROR"); }
      console.log("SUCCESS!");
    });
    res.end();
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
