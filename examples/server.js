var restful = require('../lib/restful'),
    mongoose = require('mongoose');


var app = restful({
  hostname: 'localhost',
  port: 27017,
  db: 'dev', 
});

app.register({
  title: "movies",
  methods: ['get', 'post', 'put', 'delete'],
  schema: mongoose.Schema({
    title: { type: 'string', required: true },
    year: { type: 'number', required: true },
    reviews: {
      content: {type: 'string'},
      date: { type: 'Date' },
    }
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
