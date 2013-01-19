
exports = module.exports = Resource

/**
 * A resource exposed via the api
 * Handles internal routing and handling
 */
function Resource(model, db) {
  this.resourceName = model.title.toLowerCase();
  this.title = model.title;
  this.parent = model.parent;
  this.methods = model.methods;
  this.fields = model.fields;
  this.excludes = model.excludes;
  var endurl = '/' + this.resourceName;
  // If there is no parent, just use root, othewise use their parents detailurl
  this.baseurl = this.parent ? this.parent.detailurl + endurl : endurl;
  this.detailurl = model.detailurl || this.baseurl + "/(?{<" + this.resourceName + "_key>)/";
  this.db = db;
}

Resource.prototype.methodHandler = function(method) {
  method = method.toLowerCase();
  if (method == 'get') {
    return this.get(); 
  } else if (method == 'post') {
    return this.post();
  } else if (method == 'put') {
    return this.put();
  } else if (method == 'delete') {
    return this.delete();
  } else {
    return function(req, res, next, params) {
      throw "404";
    };
  }
}

/**
 * There are differnet kind of get requests. We have 3:
 *    - Index request: get all items by some filtering or custom queryset
 *    - Detail request: get details on one item
 *    - Schema request: get the url schema for this resource
 * 
 */
Resource.prototype.get = function() {
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

Resource.prototype.printSchema = function(req, res, next, params) {
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

Resource.prototype.getindex = function() {
  var self = this;
  return function(req, res, next, params) {
    res.write("called get index on " + self.title);
    next();
  }
}

Resource.prototype.getdetail = function() {
  var self = this;
  return function(req, res, next, params) {
    res.write("called get detail on " + self.title);
    next();
  }
}

Resource.prototype.post = function() {
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
Resource.prototype.put = function() {
  var self = this;
  return function(req, res, next, params) {
    res.write("called put on " + self.title);
    next();
  }
}
Resource.prototype.delete = function() {
  var self = this;
  return function(req, res, next, params) {
    res.write("called delete on " + self.title);
    next();
  }
}
