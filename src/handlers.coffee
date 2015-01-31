_ = require 'underscore'
_ = require 'underscore'
mongooseApiQuery = require('mongoose-api-query')
handlers = require './handlers'
app = require './app'
filters = require './filters'
Route = require './route'

class Resource
  # The built in methods that we support
  @ALL_ROUTES:
    "list": Route.makeRoute('', 'get', handlers.list, false)
    "detail": Route.makeRoute('', 'get', handlers.detail, true)
    "update": Route.makeRoute('', 'put', handlers.update, true)
    "create": Route.makeRoute('', 'post', handlers.create, false)
    "destroy": Route.makeRoute('', 'delete', handlers.destroy, true)

  @ALL_METHODS: ['get', 'put', 'post', 'delete']

  constructor: (@resourceName, @Model) ->
    @preprocessor = handlers.preprocess(@Model)
    @routes = []

  withRoutes: (newRoutes) ->
    if @addedRoutes
      throw new Error("Cannot register built in routes more than once")

    newRoutes = @arrayify(newRoutes)
    validRoutes = Object.keys(Resource.ALL_ROUTES)
    
    routes = _.map newRoutes, (routeName) =>
      unless routeName in validRoutes
        throw new Error("'#{routeName}' not recognized as built in route. " +
          "Valid choices are [#{validRoutes}]")

      Resource.ALL_ROUTES[routeName]

    routes.forEach _.bind(@insertRoute, @)
    @addedRoutes = true
    @

  arrayify: (maybeNotArray) ->
    if _.isArray(maybeNotArray) then maybeNotArray else [maybeNotArray]

  # Not sure what this is meant to be
  #baseUrl: (@resourceName) ->
  #  @

  route: (path, methods, detail, fn) ->
    if arguments.length == 2
      # route(path, fn)
      fn = methods
      methods = ['get']
      detail = false
    else if arguments.length == 3
      # route(path, methods, fn)
      [detail, fn] = [false, detail]

    methods = [methods] unless _.isArray(methods)
    methods.forEach (method) =>
      route = Route.makeRoute(path, method, handle: fn, detail)
      route = @insertRoute(route)
    @

  @addMiddleware: (beforeOrAfter) ->
    (path, methods, detail, fn) ->
      methods = @arrayify(methods)
      methods.forEach (method) =>
        existingRoute = @findRoute(path, method, detail)
        unless existingRoute
          throw new Error("Trying to add #{beforeOrAfter} middleware on an " +
            "unregistered route (#{path},#{method},isDetail=#{detail})")
        existingRoute[beforeOrAfter](fn)
      @

  before: Resource.addMiddleware('before')
  after: Resource.addMiddleware('after')

  findRoute: (path, method, detail) ->
    if (path?.length > 0 and path.charAt(0) != '/')
      path = "/#{path}"
    _.findWhere @routes, path: path, method: method, detail: detail

  insertRoute: (route) ->
    existingRoute = @findRoute(route.path, route.method, route.detail)
    unless existingRoute
      @routes.push route
    else
      throw new Error("Trying to register route twice. " +
        "#{existingRoute} already registered. #{route} ignored")

  register: ->
    unless @addedRoutes
      @withRoutes('list', 'detail')

    @routes.forEach _.bind(@registerRoute, @)

  registerRoute: (route) ->
    return unless route.handler
    url = "/#{@resourceName}#{route.url()}"
    app[route.method](
      url, 
      route.beforeHandlers.concat( 
        @preprocessor, 
        route.handler.handle,
        route.afterHandlers
      )
    )

  makeHandler: (route) ->
    route.handlers()

  filter: (req) ->  
    detail = req.params.id?
    params = _.extend(req.body, req.query)
    query = @Model.apiQuery(params)
    if detail
      query = query.findOne({ id: req.params.id })
    query

  setRemoveOptions: (@removeOptions) ->
    @
  setUpdateOptions: (@updateOptions) ->
    @

exports = module.exports = Resource

class Response
  constructor: (@body, @statusCode) ->

class InternalError extends Response
  constructor: (@body) ->
    super(@body, 500)

class OkResponse extends Response
  constructor: (@body = {}) ->
    super(@body, 200)

class BadRequest extends Response
  constructor: (@body) ->
    super(@body, 400)

NO_CONTENT = new Response({}, 204)
CREATED = new Response({}, 201)
NOT_FOUND = new Response({}, 404)
  
class Handler
  constructor: (@underlyingHandler) ->
    _.bind(@underlyingHandler, @)
    _.bindAll(@, 'handle', 'getOne', 'filter', 'create')
  handle: (req, res, next) ->
    @underlyingHandler req, (response) ->
      if response
        res.status(response.statusCode)
          .json(response.body)
      else
        next()

  getOne: (req, query = req.Model.find()) ->
    detail = req.params.id?
    if !detail
      throw new Error("Trying to getOne not in a detail route")

    query.findOne id: req.param("id")

  filter: (req) ->
    params = _.extend({}, req.body, req.query, req.query.params)
    req.Model.apiQuery(params)

  create: (req) -> 
    new req.Model(req.body)

  populate: (req, query = req.Model.find()) ->
    params = _.extend({}, req.body, req.query, req.query.params)
    if params.populate
      params.populate.split(',').forEach (param) ->
        query = query.populate(param)
    query

listHandler = new Handler (req, cb) ->
  @populate(req, @filter(req)).exec (err, list) ->
    if err
      cb(new InternalError(err))
    else
      cb(new OkResponse(list))

getHandler = new Handler (req, cb) ->
  @populate(req, @getOne(req)).exec (err, obj) ->
    if err
      cb(new InternalError(err))
    else if !obj
      cb(NOT_FOUND)
    else
      cb(new OkResponse(obj))

detailPathHandlerGenerator = (pathName) ->
  detailPathHandler = new Handler (req, cb) ->
    getOne(req).populate(pathName).exec (err, obj) ->
      if err
        cb(new InternalError(err))
      else if !obj
        cb(NOT_FOUND)
      else
        cb(new OkResponse(obj?.get(pathName)))
  detailPathHandler.handle

postHandler = new Handler (req, cb) ->
  @create(req).save (err, obj) ->
    if err
      cb(new BadRequest(err))
    else
      cb(CREATED)

putHandler = new Handler (req, cb) ->
  query = @getOne(req)
  if req.body?._id == req.params.id
    delete req.body._id
  query.findOneAndUpdate {}, req.body, (err, obj) ->
    if err
      cb(new InternalError(err))
    else if !obj
      cb(NOT_FOUND)
    else
      cb(NO_CONTENT)

deleteHandler = new Handler (req, cb) ->
  @getOne(req).findOneAndRemove {}, (err, obj) ->
    if err
      cb(new InternalError(err))
    else if !obj
      cb(NOT_FOUND)
    else
      cb(NO_CONTENT)


module.exports =
  "list": listHandler,
  "detail": getHandler,
  "getDetail": detailPathHandlerGenerator,
  "create": postHandler,
  "update": putHandler,
  "destroy": deleteHandler,
  "preprocess": (Model) ->
    (req, res, next) ->
      req.Model = Model
      next()
