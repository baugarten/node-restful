var restful = require('../lib/restful'),
    mongoose = require('mongoose');


var app = restful({
  hostname: 'localhost',
  port: 27017,
  db: 'dev', 
});
app.register({
  title: "users",
  methods: ['get', 'post', 'put', 'delete'],
  schema: mongoose.Schema({
    username: { type: 'string', required: true },
    pass_hash: { type: 'number', required: true },
  }),
  delete: {
    sort: false
  } 
});
app.register({
  title: "movies",
  methods: ['get', 'post', 'put', 'delete'],
  schema: mongoose.Schema({
    title: { type: 'string', required: true },
    year: { type: 'number', required: true },
    creator: {type: 'ObjectId', ref: 'users' },
    comments: [{
      name: {type: 'String'},
      date: {type: 'Date'},
    }],
    meta: {
      productionco: 'string',
      director: 'string',
    },
  }),
});
app.register({
  title: "reviews",
  parent: "movies",
  methods: ['get', 'post', 'put', 'delete'],
  schema: mongoose.Schema({
    title: 'string',
    year: 'number', 
  }),
});
app.register({
  title: "likes",
  parent: "reviews",
  methods: ['get', 'post', 'put', 'delete'],
  schema: mongoose.Schema({
    title: 'string',
    year: 'number', 
  }),
});

app.listen(3000);
