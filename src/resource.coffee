_ = require 'underscore'
handlers = require './handlers'
app = require './app'
filters = require './filters'

class Resource
  @ALL_METHODS: ["get", "put", "post", "delete"]

  constructor: (@resourceName, @Model) ->
    @routes = []

  methods: (newmethods) ->
    if @allowedMethods?.length > 0
      throw new Error("Cannot set the methods of a resource more than once")
    @allowedMethods = @normalizeMethods(newmethods)

    @addMethodRoutes()
    @

  addMethodRoutes: ->
    @allowedMethods.forEach (method) =>
      # the only non-detail route is index
      @route('', method, (method != 'index' and method != 'post'), handlers[method])

  baseUrl: (@resourceName) ->
    @

  route: (path, methods, detail, fn) ->
    if arguments.length == 2
      fn = methods
      console.log("Route #{path}", _.without(@allowedMethods, 'detail', 'index'))
      @route(path, meth, false, fn) for meth in _.without(@allowedMethods, 'detail', 'index')
      [methods, detail] = ['get', false]
    else if arguments.length == 3
      [detail, fn] = [false, detail]

    if (path?.length > 0 and path.charAt(0) != '/')
      path = "/#{path}"

    methods = [methods] unless _.isArray(methods)
    methods.forEach (method) =>
      @routes.push {
        path: path
        method: method
        detail: detail
        handler: fn
      }
    @

  before: (path, methods, fn) ->
    if arguments.length == 2
      fn = methods
      methods = @constructor.ALL_METHODS

    @setHandlerProperty path, methods, 'before', (beforeHandlers) ->
      return (beforeHandlers or []).concat([fn])
    @

  after: (path, methods, fn) ->
    if arguments.length == 2
      fn = methods
      methods = @constructor.ALL_METHODS

    @setHandlerProperty path, methods, 'after', (beforeHandlers) ->
      return (beforeHandlers or []).concat([fn])
    @

  setHandlerProperty: (path, methods, property, setter) ->
    methods = @normalizeMethods(methods)
    methods.forEach (method) =>
      route = _.findWhere @routes, path: path, method: method
      return unless route

      route[property] = setter(route[property])
    @

  normalizeMethods: (methods) ->
    methods = [methods] unless _.isArray(methods)
    if 'get' in methods
      methods = _.without(methods, 'get')
      methods = methods.concat(['detail', 'index'])
    methods

  register: () ->
    # We treat index and detail as valid methods, but really they're just gets
    app.index = app.detail = app.get
    @routes.forEach(_.bind(_.partial(@registerRoute, app), @))

  registerRoute: (app, route) ->
    if route.detail
      url = "/#{@resourceName}/:id([0-9a-fA-F]{0,24})#{route.path}"
    else
      url = "/#{@resourceName}#{route.path}"
    console.log("Registering", route.method, url)
    app[route.method](url, @makeHandler(route))
    
  makeHandler: (route) ->
    console.log(route) unless route.handler
    [handlers.preprocess.bind(this)].concat(
      route.before or []
      route.handler.bind(this)
      route.after or []
      handlers.last
    )

  filter: (req, query = @Model.find({})) ->
    detail = req.params.id?
    query = @Model.findById(req.params.id) if req.params.id
    [req.body, req.query, req.headers].forEach (requestData) ->
      for key, value of requestData
        query = filters.filter(key, value, detail, query)

    query

  setRemoveOptions: (@removeOptions) ->
    @
  setUpdateOptions: (@updateOptions) ->
    @

exports = module.exports = Resource
