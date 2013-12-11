mongoose = require('mongoose')
Resource = require('./resource')
app = require('./app')

resources = {}

app.resource = app.model = (resourceName) ->
  Model = mongoose.model(resourceName)
  resources[resourceName] = new Resource(resourceName, Model)
  return resources[resourceName]

exports = module.exports = app
