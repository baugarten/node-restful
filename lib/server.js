var restful = require('./restful');

var app = restful();

var fields = app.fields;

app.register({
  title: "Movies",
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
  title: "comments",
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
  parent: "comments",
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
