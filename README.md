[![build status](https://secure.travis-ci.org/baugarten/node-restful.png?branch=master)](http://travis-ci.org/baugarten/node-restful)

node-restful
============

Create awesome APIs using express.

Register mongoose resources and default RESTful routes are automatically made

```js
var express = require('express'),
    restful = require('node-restful'),
    mongoose = restful.mongoose;
var app = express();

var movies = new restful.Model({
  title: "movies",
  methods: ['get', 'post', 'put', 'delete'],
  schema: mongoose.Schema({
    title: 'string',
    year: 'number',
  }),
}); 

movies.register(app, '/movies');

app.listen(3000);
```
## Install

```
npm install node-restful
```

## Usage

Here is a [tutorial](benaugarten.com/blog/2013/01/31/restful-a-better-rest-api-using-node-dot-js-with-express/) on how to use Restful

There is a good example application under examples/notes.

I will also show some features and use cases for them, how to set up routes, etc.

RESTful routes are automatically generated at the registration point. In the above examples, the routes generated are:
```
GET /movies
POST /movies
PUT /movies/:id
DELETE /movies/:id
```

### Methods
If we need code to execute before a particular method (say we need to fill in POST data beforehand), we can register a before post handler:
```js
var movies = new restful.Model({
  methods: ['get', 'put', 'delete', {
    type: 'post',
    before: function(req, res, next) {
      // change request data through req.body.property = [val]
      // Do whatever you need to
      // but be sure to call
      next(); // This calls the normal handler, needs to be called in every before/after/handler
    },
    after: function(req, res, next) {... ; next() } // Or an after handler
  }];
});
```

### Custom Routing
If we need to expose a custom resource route, lets say we want to have a search route on movies, its easy to add. Likewise, if you want to add a route that operates on a single instance (i.e. /movies/:id/route) then set the detail flag to true. 

The keys to routes are the route names. The values are either functions (last examples) or objects that specify handlers and several other properties.

```js
var movies = new restful.Model({
  routes: {
    search: {
      handler: function(req, res, next) {
        // preform a search
        res.status = 200 // the return status code
        res.bundle = {} // Whatever data you want to return, custom serialization methods soon to come
        next(); // Then pass up control
      },
      methods: ['get'], // only respond to GET requests
      detail: false, // false by default, this operates on the collection of movies, /movies/search
    },
    similar: {
      handler: function(req, res, next, err, movie) {
        // get similar movies
        next();
      },
      detail: true, // this is a detial endpoint, which operates on ONE movie, /movies/:id/similar
      methods: ['get'],
    },
    anotherroute: function(req, res, next) { ... ; next() } // All methods, /movies/anotherroute
  },
});
```

You can also add the same routes by doing
```js
moves.userroute({
  search: ...,
  similar: ...,
});
```

### Model
Important functions:
```js
Model#new(properties)
```
Makes a new instance of a particular model with the given properties. Returns a [mongoose model](http://mongoosejs.com/docs/api.html#model-js) instance.

```js
Model#userroute(route, fn)
```
Takes a route, like 'search', 'similar' or a period delimited route i.e. 'search.similar' and a function like the ones above or an object like the ones above in custom routing. It then registers the custom route at the specified endpoint. If its a detail route then it will be prefixed by '/movies/:id/', otherwise by '/movies/'. If the route has periods or slashes, then the route will be nested, i.e. if 'search.similar' is a detail route, then its endpoint would be '/movies/:id/search/similar'

```js
Model#Model
```
Returns the underlying [mongoose model](http://mongoosejs.com/docs/api.html#model-js)

```js
Model#register(app, url)
```
Registers this model to the app at the given url


### Other functions

There are also several other functions that are exposed through restful.

```js
restful.respond404()
```
Returns a JSON error response for a 404 message

```js
restful.objectNotFound()
```
Returns a JSON error response for a 404 message because we couldn't find the object specified

```js
restful.multipleObjectsFound()
```
Returns a JSON error response for a 404 message because we found too many objects on a detail route

## Contributing

Is always welcome, just reach out to [me](https://github.com/baugarten)

## MIT License
Copyright (c) 2012 by Ben Augarten

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.

