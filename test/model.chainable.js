var should = require('should'),
    request = require('supertest'),
    restful = require('../'),
    mongoose = require('mongoose'),
    sinon = require('sinon');

describe('Model', function() {
 
  before(function() {
    mongoose.model('posts', mongoose.Schema({ title: 'string' }));
  });

  it('should return a mongoose model', function() {
    var posts = restful.model('posts');

    posts.should.have.property('methods');
    posts.should.have.property('setUpdateOptions');
    posts.should.have.property('setRemoveOptions');
  });
  it('should add methods in a chainable way', function() {
    var posts = restful.model('posts');
    posts.allowedMethods.should.include('detail');
    posts.allowedMethods.should.include('index');
    posts.methods(['get', 'post', 'put'])
      .setUpdateOptions({})
      .setRemoveOptions({});
    posts.allowedMethods.should.include('detail');
    posts.allowedMethods.should.include('index');
    posts.allowedMethods.should.include('post');
    posts.allowedMethods.should.include('put');
    posts.updateOptions.should.be.a('object');
    posts.removeOptions.should.be.a('object');
    
  });
});
