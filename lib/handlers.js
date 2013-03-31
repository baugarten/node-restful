/*
 * The last handler to be called in the chain of middleware
 * This figures out what response format it should be in and sends it
 */
exports.last = function(req, res, next) {
  if (res.bundle) {
    if (req.body.format === 'js') {
      return res.send(res.bundle);
    } else if (req.body.format === 'html' || req.query.format === 'html') {
      return res.render(this.templateRoot + '/' + req.templatePath, res.bundle);
    } else {
      return res.status(res.status_code).json(res.bundle);
    }
  }
  res.send();
};

exports.schema = function(req, res, next) {
  exports.respond(res, 200, {
    resource: this.modelName,
    fields: this.fields,
    methods: this.methods,
    GET: this.detailurl,
    POST: this.baseurl,
    PUT: this.detailurl,
    DELETE: this.detailurl
  });
  next();
};

exports.get = function(req, res, next) {
  req.quer.lean().exec(function(err, list) {
    exports.respondOrErr(res, 500, err, 200, (req.params.id && list && list.length > 0) ? list[0] : list);
    next();
  });
};

/**
 * Generates a handler that returns the object at @param pathName
 * where pathName is the path to an objectId field
 */
exports.getPath = function(pathName) {
  return function(req, res, next) {
    req.quer = req.quer.populate(pathName);
    req.quer.exec(function(err, one) {
      var errStatus = ((err && err.status) ? err.status : 500);
      exports.respondOrErr(res, errStatus, err, 200, (one && one.get(pathName)) || {});
      next();
    });
  };
};

exports.post = function(req, res, next) {
  var obj = new this(req.body);
  obj.save(function(err) {
    exports.respondOrErr(res, 400, err, 201, obj);
    next();
  });
};

exports.put = function(req, res, next) {
  req.quer = req.quer.findOneAndUpdate({}, req.body, this.update);
  req.quer.exec(function(err, newObj) {
    if ((err && err.status) || !newObj) {
      exports.respond(res, err.status, err);
    } else if (err) {
      exports.respond(res, 400, exports.objectNotFound());
    } else {
      exports.respond(res, 200, newObj);
    }
    next();
  });
};

exports.delete = function(req, res, next) {
  req.quer = req.quer.findOneAndRemove({}, this.delete);
  req.quer.exec(function(err, obj) {
    exports.respondOrErr(res, ((err && err.status) ? err.status : 500), err, 200, {
      status: "OK"
    });
    next();
  });
};

// I'm going to leave these here because it might be nice to have standardized
// error messages for common failures

exports.objectNotFound = function() {
  return {
    status: 404,
    message: 'Object not found',
    name: 'ObjectNotFound',
    errors: {
      _id: {
        message: "Could not find object with specified attributes"
      }
    }
  };
};
exports.respond404 = function() {
  return {
    status: 404,
    message: 'Page Not Found',
    name: "PageNotFound",
    errors: 'Endpoint not found for model ' + this.modelName
  };
};
exports.authFailure = function() {
  return {
    status: 401,
    message: 'Unauthorized',
    name: "Unauthorized",
    errors: 'Operation not authorzed on ' + this.modelName
  };
};
exports.badRequest = function(errobj) {
  return {
    status: 400,
    message: 'Bad Request',
    name: "BadRequest",
    errors: errobj || "Your request was invalid"
  };
};

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
};

exports.respond = function(res, statusCode, content) {
  res.status_code = statusCode;
  res.bundle = content;
};
