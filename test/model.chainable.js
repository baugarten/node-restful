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
    posts.should.have.property('remove');
    posts.should.have.property('updateOptions');
    posts.should.have.property('removeOptions');
  });
  it('should add methods in a chainable way', function() {
    var posts = restful.model('posts');
    posts.allowed_methods.should.have.property('get');
    posts.methods(['get', 'post', 'put'])
      .updateOptions({})
      .removeOptions({})
      .template('/idk/where/this/goes/');
    posts.allowed_methods.should.containEql('get');
    posts.allowed_methods.should.containEql('post');
    posts.allowed_methods.should.containEql('put');
    posts.update_options.should.be.an.instanceOf(Object);
    posts.remove_options.should.be.an.instanceOf(Object);
    posts.templateRoot.should.eql('/idk/where/this/goes');
    
  });
  it('should be updateable', function(done) {
    var Posts = restful.model('posts');
    Posts.create({
      title: "First post"
    }, function(err, post) {
      post.title.should.equal('First post');
      Posts.update({_id: post._id}, { title: "Second post"}, function(err, count, resp) {
        count.n.should.equal(1);
        done()
      });
    })
  });
});
