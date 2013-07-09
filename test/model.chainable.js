var should = require('should'),
    request = require('supertest'),
    restful = require('../'),
    mongoose = require('mongoose'),
    sinon = require('sinon');

describe('Model', function() {
 
  before(function() {
    restful.model('posts', mongoose.Schema({ title: 'string' }));
  });
  it('should return a mongoose model', function() {
    var posts = restful.model('posts');

    posts.should.have.property('methods');
    posts.should.have.property('update');
    posts.should.have.property('delete');
    posts.should.have.property('delete');
  });
  it('should add methods in a chainable way', function() {
    var posts = restful.model('posts');
    posts.allowed_methods.should.have.property('get');
    posts.methods(['get', 'post', 'put'])
      .update({})
      .delete({})
      .template('/idk/where/this/goes/');
    posts.allowed_methods.should.include('get');
    posts.allowed_methods.should.include('post');
    posts.allowed_methods.should.include('put');
    posts.update_options.should.be.a('object');
    posts.delete_options.should.be.a('object');
    posts.templateRoot.should.eql('/idk/where/this/goes');
  });
  it('should be updateable', function() {
    var Posts = restful.model('posts');
    Posts.create({
      title: "First post"
    }, function(err, post) {
      post.title.should.equal('First post');
      Posts.update({_id: post._id}, { title: "Second post"}, function(err, numUpdated, post) {
        numUpdated.should.equal(1);
        post.ok.should.equal(1);
      });
    })
  });
});
