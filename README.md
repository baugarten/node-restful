[![build status](https://secure.travis-ci.org/baugarten/node-restful.png?branch=master)](http://travis-ci.org/baugarten/node-restful)

node-restful
============

A restful server for quickly providing a data api

Register mongoose resources and default RESTful routes are automatically made

Based on express

```js
var restful = require('restful'),
    mongoose = require('mongoose');
var app = restful();

app.register({
  title: "movies",
  methods: ['get', 'post', 'put', 'delete'],
  schema: mongoose.Schema({
    title: 'string',
    year: 'number',
  }),
}); 

app.listen(3000);
```

More examples to come

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

