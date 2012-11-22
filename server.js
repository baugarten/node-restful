var restful = require('./restful');

var app = restful();

var fields = app.fields;

app.register({
  title: "Movies",
  methods: ['get', 'post', 'update', 'delete'],
  fields: {
    title: fields.CharField({
             max_length: 100
           }),
    year: fields.IntegerField({
          }),
  }
});

app.listen(3000);
