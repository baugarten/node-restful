var express = require('express'),
    mongoose = require('mongoose'),
    restful = require('../../');

var app = module.exports = express();

// Connect to mongodb -- used to store the models
mongoose.connect("mongodb://localhost/expressmvc");

app.use(express.bodyParser());

app.use(express.methodOverride());

// expose a list of models to register
var models = require('./models/index');
models.forEach(function(model) {
  console.log("Register " + model.resourceName);
  model.register(app, '/' + model.resourceName);
});

app.listen(3000);
