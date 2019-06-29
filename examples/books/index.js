var express = require('express'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    mongoose = require('mongoose'),
    morgan = require('morgan'),
    restful = require('../../');
var app = module.exports = express();


app.use(morgan('dev'));
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({type:'application/vnd.api+json'}));
app.use(methodOverride());
app.set('view engine', 'jade');
app.use((req, res, next) => {
  req.findBy= {
    'author': {'$eq': 'Ken Wilber' }
  };
  next();
});

app.mongoose = mongoose; // used for testing

mongoose.connect("mongodb://localhost/books_test");


var books = app.books = restful.model("books", mongoose.Schema({
    title: { type: 'string', required: true },
    year: { type: 'number', required: true },
  }));

books.methods([
    { 
      method: 'get', 
      before: noop,
      after: noop
    }, 
    'post', 
    'put', 
    'delete'])
  .updateOptions({ new: true })

books.register(app, '/api/books');

if (!module.parent) {
  app.listen(3000);
}

function noop(req, res, next) { next(); }

