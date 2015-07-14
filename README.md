[![build status](https://secure.travis-ci.org/baugarten/node-restful.png?branch=master)](http://travis-ci.org/baugarten/node-restful)

node-restful
============

Create awesome APIs using express.

Register mongoose resources and default RESTful routes are automatically made

```js
var express = require('express'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    morgan = require('morgan'),
    restful = require('node-restful'),
    mongoose = restful.mongoose;
var app = express();

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({type:'application/vnd.api+json'}));
app.use(methodOverride());

mongoose.connect("mongodb://localhost/resources");

var Resource = app.resource = restful.model('resource', mongoose.Schema({
    title: String,
    year: Number,
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

## Support

This library is currently supported through complaint driven development, so if you see something, have a feature request, open an issue and if it seems to jive with the mission of the library, I'll prioritize it.

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

### Built-in Filters

Node-restful accepts many options to manipulate the list results. These options can be added to your request either via the querystring or the POST body. They are passed into the mongoose query to filter your resultset.

#### Selecting the entity-properties you need

If you only need a few properties instead of the entire model, you can ask the service to only give just the properties you need:

A `GET` request to `/users/?select=name%20email` will result in:

```json
[
    {
        "_id": "543adb9c7a0f149e3ac29438",
        "name": "user1",
        "email": "user1@test.com"
    },
    {
        "_id": "543adb9c7a0f149e3ac2943b",
        "name": "user2",
        "email": "user2@test.com"
    }
]
```

#### Limiting the number and skipping items

When implementing pagination you might want to use `skip` and `limit` filters. Both do exactly what their name says and just skip given amount of items or limit to a set amount of items.

`/users/?limit=5` will give you the first 5 items  
`/users/?skip=5` will skip the first 5 and give you the rest  
`/users/?limit=5&skip=5` will skip the first 5 and then give you the second 5

#### Sorting the result

Getting a sorted list is as easy as adding a `sort` querystring parameter with the property you want to sort on. `/users/?sort=name` will give you a list sorted on the name property, with an ascending sort order.

Changing the sort order uses the same rules as the string notation of [mongoose's sort filter](http://mongoosejs.com/docs/api.html#query_Query-sort). `/users/?sort=-name` will return the same list as before with a descending sort order.

#### Filtering the results

Sometimes you just want to get all people older than 18, or you are want to get all people living in a certain city. Then you would want to 
use filters for that. You can ask the service for equality, or values greater or less than, give it an array of values it should match to, or even a regex.

| Filter                       | Query  | Example                                              | Description                     |
|------------------------------|--------|------------------------------------------------------|---------------------------------|
| **equal**                    | `equals` | `/users?gender=male` or `/users?gender__equals=male` | both return all male users      |
| **not equal**                | `ne`     | `/users?gender__ne=male`                             | returns all users who are not male (`female` and `x`)        |
| **greater than**             | `gt`     | `/users?age__gt=18`                                  | returns all users older than 18                                   |
| **greater than or equal to** | `gte`    | `/users?age__gte=18`                                 | returns all users 18 and older (age should be a number property) |
| **less than**                | `lt`     | `/users?age__lt=30`                                  | returns all users age 29 and younger                              |
| **less than or equal to**    | `lte`    | `/users?age__lte=30`                                 | returns all users age 30 and younger                             |
| **in**                       | `in`     | `/users?gender__in=female,male`                         | returns all female and male users                    |
| **nin**                      | `nin`    | `/users?age__nin=18,30`                                 | returns all users with age other than 18 or 30                |
| **Regex**                    | `regex`  | `/users?username__regex=/^baugarten/i` | returns all users with a username starting with baugarten           |

### Populating a sub-entity

When you have setup a mongoose Schema with properties referencing other entities, you can ask the service to populate them for you.

A `GET` request to `/users/542edff9fffc55dd29d99346` will result in:

```json
{
    "_id": "542edff9fffc55dd29d99346",
    "name": "the employee",
    "email": "employee@company.com",
    "boss": "542edff9fffc55dd29d99343",
    "__v": 0
}
```
A `GET` request to `/users/542edff9fffc55dd29d99346?populate=boss` will result in:

```json
{
    "_id": "542edff9fffc55dd29d99346",
    "name": "the employee",
    "email": "employee@company.com",
    "boss": {
        "_id": "542edff9fffc55dd29d99343",
        "name": "the boss",
        "email": "boss@company.com",
        "__v": 0
    },
    "__v": 0
}
```



---

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

