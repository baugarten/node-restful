mongoose = require('mongoose')
mongooseApiQuery = require('mongoose-api-query')
Resource = require('./resource')
app = require('./app')

resources = {}

app.resource = app.model = (resourceName, schema) ->
  schema.plugin(mongooseApiQuery)
  Model = mongoose.model(resourceName, schema)
  resources[resourceName] = new Resource(resourceName, Model)
  return resources[resourceName]

exports = module.exports = app
