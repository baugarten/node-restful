exports.wrap = function(path, detail, fn) {
  if (arguments.length === 2) {
    fn = detail;
    detail = false;
  }
  path = path.replace(/\//, /\./);
  if (detail) {
    return function(req, res, next) {
      var self = this;
      res.on('closing', function(res) { self.emit('after.' + path, req, res, next); });
      this.emit('before.' + path, req, res, next);
      exports.requireOneModel.call(this, res, req.quer, function(err, model) {
        fn(req, res, next, err, model);
      });
    }
  } 
  return function(req, res, next) {
    var self = this;
    res.on('closing', function(res) { self.emit('after.' + path, req, res, next); });
    this.emit('before.' + path, req, res, next);
    fn.call(this, req, res, next);
  }
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
  }
}

exports.get = exports.wrap('get', function(req, res, next) {
  req.quer.lean().exec(function(err, list) {
    exports.respondOrErr(res, 500, err, 200, list);
  });
});

exports.getPath = function(pathName) {
  return exports.wrap('get', pathName + '.get', function(req, res, next) {
    console.log("Called GET PATH on " + this.resourceName);
    req.quer = req.quer.populate(pathName).findOne();
    req.quer._exec = true;
    exports.requireOneModel.call(this, res, req.quer, function(err, one) {
      exports.respondOrErr(res, 500, err, 200, one.get(pathName) || {});
    });
  });
}

exports.post = exports.wrap('post', function(req, res, next) {
  var self = this;
  console.log("Called POST on " + self.resourceName);
  var obj = new this.Obj(req.body);
  obj.save(function(err) {
    exports.respondOrErr(res, 400, err, 201, obj);
  });
});

exports.put = exports.wrap('put', function(req, res, next) {
  var self = this;
  console.log("Called PUT on " + self.resourceName);
  req.quer = req.quer.findOneAndUpdate({}, req.body, this.update);
  req.quer._exec = true;
  exports.requireOneModel.call(this, res, req.quer, function(err, newObj) {
    if (err) {
      exports.respond(res, 400, err);
    } else if (!newObj) {
      exports.respond(res, 404, exports.objectNotFound());
    } else {
      exports.respond(res, 200, newObj);
    }
  });
});

exports.delete = exports.wrap('delete', function(req, res, next) {
  var self = this;
  console.log("Called DELETE on " + self.resourceName);
  req.quer = req.quer.findOneAndRemove({}, this.delete);
  req.quer._exec = true;
  exports.requireOneModel.call(this, res, req.quer, function(err, obj) {
    exports.respondOrErr(res, 400, err, 200, {
      status: "OK"
    });
  });
});


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
        exports.respond(res, 404, exports.multipleObjectsFound());
      } else if (list.length === 0) {
        exports.respond(res, 404, exports.objectNotFound());
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
  res._statusCode = statusCode;
  res.content = content;
  res.end();
}
