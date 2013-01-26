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
  }
}

exports.get = function() {
  var self = this;
  return function(req, res, next, params) {
    console.log("GET on " + self.resourceName);
    req.quer.lean().exec(function(err, list) {
      if (err)
        return exports.respond(res, 500, err);
      return exports.respond(res, 200, list);
    });
  }
}
exports.getPath = function(pathName) {
  var self = this;
  return function(req, res, next) {
    console.log("Called GET PATH on " + self.resourceName);
    req.quer = req.quer.populate(pathName).findOne();
    exports.requireOneModel.call(self, res, req.quer, function(err, one) {
      if (err) return exports.respond(res, 500, err);
      return exports.respond(res, 200, one.get(pathName) || {});
    });
  }
}

exports.post = function() {
  var self = this;
  return function(req, res, next, params) {
    console.log("Called POST on " + self.resourceName);
    var obj = new self.Obj(req.body);
    obj.save(function(err) {
      exports.respondOr400(res, err, 201, obj);
    });
  }
}

exports.put = function() {
  var self = this;
  return function(req, res, next, filters) {
    console.log("Called PUT on " + self.resourceName);
    req.quer = req.quer.findOneAndUpdate({}, req.body, self.update);
    exports.requireOneModel.call(self, res, req.quer, function(err, newObj) {
      if (err) {
        return exports.respond(res, 400, err);
      }
      if (!newObj) {
        exports.objectNotFound(res);
      } else {
        exports.respond(res, 200, newObj);
      }
      res.end();
    });
  }
}
exports.delete = function() {
  var self = this;
  return function(req, res, next, params) {
    console.log("Called DELETE on " + self.resourceName);
    req.quer = req.quer.findOneAndRemove({}, self.delete);
    exports.requireOneModel.call(self, res, req.quer, function(err, obj) {
      exports.respondOr400(res, err, 200, {
        status: "OK"
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
exports.requireOneModel = function(res, quer, callback) {
  // Make the haveOneModel more robust by checking all UNIQUE fields
  var haveOneModel = ('_id' in quer._conditions);

  if (!haveOneModel) {
    this.Obj.find(quer.conditions).limit(2).exec(function(err, list) {
      if (list.length > 1) {
        exports.respond(res, 404, {
          message: 'Multiple Objects Found',
          name: 'MultipleObjectsFound',
          errors: {
            __all__: {
              message: "Multiple objects were found (forbidden in model declaration)"
            }
          }
        });
      } else if (list.length === 0) {
        exports.objectNotFound(res);
      } else {
        quer.exec(callback);
      }
    });
  } else {
    quer.exec(callback);
  }
}

exports.objectNotFound = function(res) {
  exports.respond(res, 404, {
    message: 'Object not found',
    name: 'ObjectNotFound',
    errors: {
      _id: {
        message: "Could not find object with specified attributes",
      }
    }
  });
}
exports.respond404 = function(res) {
  exports.respond(res, 404, {
    message: 'Page Not Found',
    name: "PageNotFound",
    errors: 'Endpoint not found for model ' + this.resourceName,
  });
}

/**
 * Takes a response, error, success statusCode and success payload
 *
 * If there is an error, it returns a 400 with the error as the payload
 * If there is no error, it returns statusCode with the specified payload
 *
 */
exports.respondOr400 = function(res, err, statusCode, payload) {
  if (err) {
    exports.respond(res, 400, err);
  } else {
    exports.respond(res, statusCode, payload);
  }
}

exports.respond = function(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.write(JSON.stringify(payload));
  res.end();
}
