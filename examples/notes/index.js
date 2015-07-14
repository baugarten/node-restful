var express = require('express'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    mongoose = require('mongoose'),
    morgan = require('morgan'),
    restful = require('../');
var app = module.exports = express();

// Connect to mongodb -- used to store the models
mongoose.connect("mongodb://localhost/expressmvc");

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({type:'application/vnd.api+json'}));
app.use(methodOverride());

// expose a list of models to register
var models = require('./models/index');
models.forEach(function(model) {
  console.log("Register " + model.resourceName);
  model.register(app, '/' + model.resourceName);
});

app.listen(3000);
