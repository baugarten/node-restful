exports.wrap = function(path, detail, fn) {
  var self = this,
      stack = [],
      detail;
  if (arguments.length === 2) {
    fn = detail; 
  }
  if ('function' !== typeof fn) {
    if (fn.after) {
      if ('function' === typeof fn.after) stack.push(fn.after);
      else stack.push.apply(stack, fn.after)
      after = fn.after;
    }
    if (fn.detail) fn.handler = exports.detailWrap.call(this, fn.handler);
    stack.push(fn.handler);
    if (fn.before) {
      if ('function' === typeof fn.before) stack.push(fn.before);
      else stack.push.apply(stack, fn.before);
    }
  } else {
    stack.push(fn);
  }
  stack.push(exports.last);
  return function(req, res, next) {
    var self = this,
        i = 0;
    function next(err) {
      if (err) return exports.error(req, res, err);
      stack[i++].call(self, req, res, next);
    }
    next();
  }
}

exports.detailWrap = function(handler) {
  var self = this;
  return function(req, res, next) {
    exports.requireOneModel.call(self, res, req.quer, function(err, model) {
      handler.call(self, req, res, next, err, model)
    });
  }
}

exports.error = function(req, res, err) {
  exports.respond(res, err.status, err);
  exports.last(req, res, err);
}

exports.last = function(req, res) {
  res.writeHeader(res.status, { 'Content-Type': 'application/json' });
  if (res.bundle) res.write(JSON.stringify(res.bundle));
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
    next();
  });
}

exports.getPath = function(pathName) {
  return exports.wrap('get', pathName + '.get', function(req, res, next) {
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
  var obj = this.new(req.body);
  obj.save(function(err) {
    exports.respondOrErr(res, 400, err, 201, obj);
    next();
  });
}

exports.put = function(req, res, next) {
  var self = this;
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
    this.Model.find(quer.conditions).limit(2).exec(function(err, list) {
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
    this.Model.findById(quer._conditions._id, callback);
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
    status: 404,
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
  res.status = statusCode;
  res.bundle = content;
}
