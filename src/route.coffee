handlers = require('./handlers')
class Route
  constructor: (@path, @method, @handler, @detail=false,
    @_before=[], @_after=[]) ->

  before: (before) ->
    @_before.push before

  after: (after) ->
    @_after.push after

  url: ->
    if @detail
      url = "/:id([0-9a-fA-F]{0,24})#{@path}"
    else
      url = "#{@path}"

  handlers: ->
    return @_before.concat(
      @handler.handle,
      @_after
    )

  toString: ->
    "('#{@path}', #{@method}, detail=#{@detail})"

  @makeRoute: (path, method, handler, detail) ->
    if (path?.length > 0 and path.charAt(0) != '/')
      path = "/#{path}"

    new Route(path, method, handler, detail)

module.exports = Route

