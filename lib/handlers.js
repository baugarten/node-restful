exports.wrap = function(path, detail, fn) {
  var before = function(req, res, next) { next(); }, 
      after = function(req, res, next) { next(); };
  if (arguments.length === 2) {
    fn = detail;
    detail = false;
  }
  if ('function' !== typeof fn) {
    if (fn.before) before = fn.before;
    if (fn.after) after = fn.after;
    fn = fn.fn;
  }
  path = path.replace(/\//, /\./);
  if (detail) {
    return function(req, res, next) {
      var self = this;
      before(req, res, function(err) {
        exports.requireOneModel.call(self, res, req.quer, function(err, model) {
          fn.call(self, req, res, function() {
            after(req, res, function() {
              exports.last(req, res);
            });
          }, err, model);
        });
      });
    }
  } 
  return function(req, res, next) {
    var self = this;
    before.call(self, req, res, function(err) {
      fn.call(self, req, res, function() {
        after.call(self, req, res, function() {
          exports.last(req, res);
        }); 
      });
    });
  }
}

exports.last = function(req, res) {
  res.bundle && res.write(res.bundle);
  res.send();
}

/**
 * Returns the route handler for dumping this models schema
 */
exports.schema = function() {
  var self = this;
  return function(req, res, next) {
    exports.respond(res, 200, {
      resource: self.resourceName,
      fields: self.fields,
      methods: self.methods,
      GET: self.detailurl,
      POST: self.baseurl,
      PUT: self.detailurl,
      DELETE: self.detailurl,
    });
    next();
  }
}

exports.get = function(req, res, next) {
  req.quer.lean().exec(function(err, list) {
    exports.respondOrErr(res, 500, err, 200, ((list.length === 1) ? list[0] : list));
    console.log("Called GET: next");
    next();
  });
}

exports.getPath = function(pathName) {
  return exports.wrap('get', pathName + '.get', function(req, res, next) {
    console.log("Called GET PATH on " + this.resourceName);
    req.quer = req.quer.populate(pathName).findOne();
    req.quer._exec = true;
    exports.requireOneModel.call(this, res, req.quer, function(err, one) {
      var errStatus = ((err && err.status) ? err.status : 500);
      exports.respondOrErr(res, errStatus, err, 200, (one && one.get(pathName)) || {});
      next();
    });
  });
}

exports.post = function(req, res, next) {
  var self = this;
  console.log("Called POST on " + self.resourceName);
  var obj = new this.Obj(req.body);
  obj.save(function(err) {
    exports.respondOrErr(res, 400, err, 201, obj);
    next();
  });
}

exports.put = function(req, res, next) {
  var self = this;
  console.log("Called PUT on " + self.resourceName);
  req.quer = req.quer.findOneAndUpdate({}, req.body, this.update);
  req.quer._exec = true;
  exports.requireOneModel.call(this, res, req.quer, function(err, newObj) {
    if ((err && err.status) || !newObj) {
      exports.respond(res, err.status, err);
    } else if (err) {
      exports.respond(res, 400, exports.objectNotFound());
    } else {
      exports.respond(res, 200, newObj);
    }
    next();
  });
}

exports.delete = function(req, res, next) {
  var self = this;
  console.log("Called DELETE on " + self.resourceName);
  req.quer = req.quer.findOneAndRemove({}, this.delete);
  req.quer._exec = true;
  exports.requireOneModel.call(this, res, req.quer, function(err, obj) {
    exports.respondOrErr(res, ((err && err.status) ? err.status : 500), err, 200, {
      status: "OK"
    });
    next();
  });
}


/**
 * If the model requires a single matching object for the given method (update or delete)
 * then this method requires that there is only one matching model
 *
 * If there aren't, the callback is NOT called, and an error is written to the response.
 *
 */
exports.requireOneModel = function(res, quer, callback) {
  // Make the haveOneModel more robust by checking all UNIQUE fields
  var haveOneModel = ('_id' in quer._conditions);

  if (!haveOneModel) {
    this.Obj.find(quer.conditions).limit(2).exec(function(err, list) {
      if (list.length > 1) {
        callback(exports.multipleObjectsFound());
      } else if (list.length === 0) {
        callback(exports.objectNotFound());
      } else if (quer._exec) {
        quer.exec(callback);
      } else {
        callback(null, list[0]);
      }
    });
  } else if (quer._exec) {
    quer.exec(callback);
  } else {
    this.Obj.findById(quer._conditions._id, callback);
  }
}

exports.multipleObjectsFound = function() {
  return  {
    status: 404,
    message: 'Multiple Objects Found',
    name: 'MultipleObjectsFound',
    errors: {
      __all__: {
       message: "Multiple objects were found (try a more specific filter or id)"
      }
    }
  }
}
exports.objectNotFound = function(res) {
  return {
    status: 404,
    message: 'Object not found',
    name: 'ObjectNotFound',
    errors: {
      _id: {
        message: "Could not find object with specified attributes",
      }
    }
  }
}
exports.respond404 = function(res) {
  return {
    message: 'Page Not Found',
    name: "PageNotFound",
    errors: 'Endpoint not found for model ' + this.resourceName,
  }
}

/**
 * Takes a response, error, success statusCode and success payload
 *
 * If there is an error, it returns a 400 with the error as the payload
 * If there is no error, it returns statusCode with the specified payload
 *
 */
exports.respondOrErr = function(res, errStatusCode, err, statusCode, content) {
  if (err) {
    exports.respond(res, errStatusCode, err);
  } else {
    exports.respond(res, statusCode, content);
  }
}

exports.respond = function(res, statusCode, content) {
  res.writeHeader(statusCode, { 'Content-Type': 'application/json' });
  res.bundle = JSON.stringify(content);
}
