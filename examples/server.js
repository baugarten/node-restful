var restful = require('../lib/restful');


var app = restful({
  hostname: 'localhost',
  port: 27017,
  db: 'dev', 
});

var fields = app.fields;

app.register({
  title: "movies",
  methods: ['get', 'post', 'put', 'delete'],
  fields: {
    title: fields.CharField({
             max_length: 100
           }),
    year: fields.IntegerField({
          }),
  }
});
app.register({
  title: "reviews",
  parent: "movies",
  methods: ['get', 'post', 'put', 'delete'],
  fields: {
    title: fields.CharField({
             max_length: 100
           }),
    year: fields.IntegerField({
          }),
  }
});
app.register({
  title: "likes",
  parent: "reviews",
  methods: ['get', 'post', 'put', 'delete'],
  fields: {
    title: fields.CharField({
             max_length: 100
           }),
    year: fields.IntegerField({
          }),
  }
});

app.listen(3000);
