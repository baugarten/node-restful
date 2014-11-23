class Response
  constructor: (@body, @statusCode) ->

class Handler
  handle: (req) ->
    next()

  getOne: (req) ->
    null

  filter: (req) ->
    null

  create: (req) ->
    null

class ListHandler extends Handler
  handle: (req) ->
    query = filter(req)
    query.exec (err, list) ->
      exports.respondOrError(res, err, 500, list, 200)
      next()

class DetailHandler extends Handler
  handle: (req) ->
    getOne(req).exec (err, obj) ->
    exports.respondOrError(res, err, 500, list, 200)
    next()  

class DetailPathHandler extends Handler
  pathName: "something"

  handle: (req) ->
    getOne(req).populate(pathName).exec (err, obj) ->
      errStatus = err?.status or 500
      exports.respondOrError(res, err, errStatus, obj?.get(pathName), 200)
      next()

class PostHandler extends Handler
  handle: (req) ->
    create(req.body).save (err) ->
      exports.respondOrError(res, err, 400, obj, 201)
      next()

class PutHandler extends Handler
  handle: (req) ->
    query = getOne(req)
    if req.body?._id == req.params.id
      delete req.body._id
    query.findOneAndUpdate {}, req.body, (err, obj) ->
      if err
        exports.respond(res, err, 500)
      else if !obj
        exports.respond(res, exports.objectNotFound, 404)
      else
        exports.respond(res, obj, 200)
      next()

class DeleteHandler extends Handler
  handle: (req) ->
    getOne(req).findOneAndRemove {}, (err, obj) ->
      if err
        exports.respond(res, err, 500)
      else if !obj
        exports.respond(res, exports.objectNotFound, 404)
      else
        exports.respond(res, obj, 204)
      next()


exports.preprocess = (req, res, next) ->
  req.body = req.body or {}
  req.query = @filter(req)
  res.locals = res.locals or {}
  res.locals.bundle = {}
  next()

exports.last = (req, res, next) ->
  if res.locals.bundle
    # res.send(res.locals.bundle)
    # res.render(this.templateRoot + '/' + req.templatePath, res.locals.bundle)
    res.statusCode = res.locals.status_code
    res.send(res.locals.bundle)
  else
    res.send()

exports.list = (req, res, next) ->
  req.query.exec (err, list) ->
    exports.respondOrError(res, err, 500, list, 200)
    next()

exports.detail = (req, res, next) ->
  req.query.exec (err, obj) ->
    exports.respondOrError(res, err, 500, obj, 200)
    next()

exports.getPath = (pathName) ->
  (req, res, next) ->
    req.query = req.query.populate(pathName)
    req.query.exec (err, obj) ->
      errStatus = err?.status or 500
      exports.respondOrError(res, err, errStatus, obj?.get(pathName), 200)
      next()

exports.create = (req, res, next) ->
  obj = new @Model(req.body)
  obj.save (err) ->
    exports.respondOrError(res, err, 400, obj, 201)
    next()

exports.update = (req, res, next) ->
  if req.body?._id == req.params.id
    delete req.body._id
  req.query.findOneAndUpdate {}, req.body, (err, obj) ->
    if err
      exports.respond(res, err, 500)
    else if !obj
      exports.respond(res, exports.objectNotFound, 404)
    else
      exports.respond(res, obj, 200)
    next()

exports.destroy = (req, res, next) ->
  req.query.findOneAndRemove {}, (err, obj) ->
    if err
      exports.respond(res, err, 500)
    else if !obj
      exports.respond(res, exports.objectNotFound, 404)
    else
      exports.respond(res, obj, 204)
    next()

exports.objectNotFound =
  status: 404
  message: 'Resource not found'
  name: 'NotFound'

exports.respondOrError = (res, errObj, errStatusCode, succObj, succStatusCode) ->
  if errObj
    exports.respond(res, errObj, errStatusCode)
  else
    exports.respond(res, succObj, succStatusCode)

exports.respond = (res, content, statusCode) ->
  res.locals.bundle = content
  res.locals.status_code = statusCode
