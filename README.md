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

app.use(express.bodyParser());
app.use(express.query());

mongoose.connect("mongodb://localhost/resources");

var Resource = app.resource = restful.model('resource', mongoose.Schema({
    title: 'string',
    year: 'number',
  }))
  .methods(['get', 'post', 'put', 'delete']);

Resource.register(app, '/resources');

app.listen(3000);
```

Registers the following routes:

    GET /resources
    GET /resources/:id
    POST /resources
    PUT /resources/:id
    DELETE /resources/:id

which do exactly what you think they do!

The best part is that `restful.model` returns a Mongoose model, so you can interact with it the same way that you're already accustomed to! (i.e. `new Resource`, `Resource.findById`, etc.)

## Install

```
npm install node-restful
```

## Usage

There is a good example application under examples/movies.

I will also show some features and use cases for them, how to set up routes, etc.

### API

There are a few functions that are available after we register the mongoose schema. The first one we already saw. 

`.methods([...])` takes a list of methods that should be available on the resource. Future calls to methods will override previously set values
To disallow `delete` operations, simply run

```js
Resource.methods(['get', 'post', 'put'])
```
    
We can also run custom routes. We can add custom routes by calling `.route(path, handler)`

```js
Resource.route('recommend', function(req, res, next) {
  res.send('I have a recommendation for you!');
});
```

This will set up a route at `/resources/recommend`, which will be called on all HTTP methods. We can also restrict the HTTP method by adding it to the path:

```js
Resource.route('recommend.get', function(req, res, next) {
   res.send('GET a recommendation');
});
Resource.route('recommend', ['get', 'put', 'delete'], function(req, res, next) { ... });
```
    
Or do some combination of HTTP methods.

Now. Lets say we have to run arbitrary code before or after a route. Lets say we need to hash a password before a POST or PUT operation. Well, easy.

```js
Resource.before('post', hash_password)
  .before('put', hash_password);
      
function hash_password(req, res, next) {
  req.body.password = hash(req.body.password);
  next();
}
```

Boy. That was easy. What about doing stuff after request, but before its sent back to the user? Restful stores the bundle of data to be returned in `res.locals` (see [express docs](http://expressjs.com/api.html#res.locals)). `res.locals.status_code` is the returned status code and `res.locals.bundle` is the bundle of data. In every before and after call, you are free to modify these are you see fit!

```js
Resource.after('get', function(req, res, next) {
  var tmp = res.locals.bundle.title; // Lets swap the title and year fields because we're funny!
  res.locals.bundle.title = res.locals.bundle.year;
  res.locals.bundle.year = tmp;
  next(); // Don't forget to call next!
});
    
Resource.after('recommend', do_something); // Runs after all HTTP verbs
```

Now, this is all great. But up until now we've really only talked about defining list routes, those at `/resources/route_name`. We can also define detail routes. Those look like this

```js
Resource.route('moreinfo', {
    detail: true,
    handler: function(req, res, next) {
        // req.params.id holds the resource's id
        res.send("I'm at /resources/:id/moreinfo!")
    }
});
```
I don't think this is the prettiest, and I'd be open to suggestions on how to beautify detail route definition...

And that's everything for now!

## Contributing

You can view the issue list for what I'm working on, or contact me to help!

Just reach out to [me](https://github.com/baugarten)

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

