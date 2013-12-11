_ = require 'underscore'

utils = {}

utils.routeMethods = ['index', 'detail', 'put', 'delete']

utils.endsWithMethod = (path) ->
  pathParts = path.split(/\//)
  return pathParts[pathParts.length - 1] in utils.routeMethods

utils.endsWith = (path, method) ->
  pathParts = path.split(/\//)
  return pathParts[pathParts.length - 1] == method

exports = module.exports = utils
