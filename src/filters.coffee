_ = require 'underscore'

class Filters
  constructor: (@filters, @subfilters) ->

  filter: (key, val, detail, query) ->
    return query unless @contains(key, detail, query)
    return @filters[key].query(query, val) if @filters[key]
    filterFuncs = @parseFilterKey(key)
    subfilter = @subfilters[filterFuncs.subFilter]
    subfilter.query query.where(filterFuncs.schemaPath), val

  contains: (key, detail, query) ->
    return @filters[key].canFilterRoute(detail) if key of @filters
    return false if detail
    filterFuncs = @parseFilterKey(key)
    filterFuncs.schemaPath of query.model.schema.paths and filterFuncs.subFilter of @subfilters

  parseFilterKey: (key) ->
    filterFuncs = key.split("__")
    schemaPath: filterFuncs[0]
    subFilter: filterFuncs[1] or "equals"

class Filter
  @arrayFilters: ["in"]
  @validDetailFilters: ["populate"]

  @createFilter: (filterName) ->
    if filterName in @arrayFilters
      return new ArrayFilter(filterName)
    else
      return new Filter(filterName)

  @coerceData: (data) ->
    # Assume data is a string
    if data and data.toLowerCase and data.toLowerCase() is "true"
      return true
    else return false  if data and data.toLowerCase and data.toLowerCase() is "false"
    data

  constructor: (@key, @queryHandler = null) ->

  query: (query, val) ->
    val = @prepareData(val)
    if _.isFunction(@queryHandler)
      @queryHandler query, @key, val
    else
      query[@key] val

  prepareData: (data) ->
    @constructor.coerceData data

  canFilterRoute: (detail) ->
    return true  unless detail
    return @constructor.validDetailFilters.indexOf(@key) > -1

class ArrayFilter extends Filter
  prepareData: (data) ->
    return super(data).split ","

createFilter = (filters) ->
  filterMap = {}
  filters.forEach (filterName) ->
    filterMap[filterName] = Filter.createFilter(filterName)

  filterMap

module.exports = new Filters(createFilter(["populate", "limit", "skip", "offset", "select", "sort"]), createFilter(["equals", "gte", "gt", "lt", "lte", "ne", "regex", "in"]))
