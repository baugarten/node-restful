
exports = module.exports = Resource

function Resource(model) {
  this.resourceName = model.title;model.title.toLowerCase();
  this.title = model.title;model.title.toLowerCase();
  if (model.hasOwnProperty('parent')) {
    this.parent = model.parent;
  } else {
    this.parent = null;
  }
  this.fields = model.fields;
  this.excludes = model.excludes;
}

Resource.prototype.methodHandler = function(method) {
  method = method.toLowerCase();
  if (method == 'get') {
    return this.get(); 
  } else {
    return function(req, res, next, params) {
      throw "404";
    };
  }
}

Resource.prototype.get = function() {
  var self = this;
  return function(req, res, next, params) {
    console.log("Handler");
    console.log(self.title);
    console.log(self);
    res.write("called get on " + self.title);
    console.log(next);
    next();
  }
}
