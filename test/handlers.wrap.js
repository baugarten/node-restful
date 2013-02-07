var handlers = require('../lib/handlers'),
    sinon = require('sinon'),
    should = require('should');

describe('handlers', function() {
  describe('.wrap(path, detial, fn)', function() {
    var res, get, spiedget, bef, spiedbefore;
    before(function() {
      res = {};
      res.send = function() {};
      res.end = function() {};
      res.writeHeader = function() {};
    });
    beforeEach(function() {
      get = function(req, res, next) {
        next();
      };
      bef = function(res, res, next) { 
        next(); 
      };
      spiedget = sinon.spy(get);
      spiedbefore = sinon.spy(bef);
    });
    it('should wrap a fn at GET', function() {
      spiedget.called.should.be.false;
      var wrapped = handlers.wrap('get', spiedget);
      wrapped({}, res);
      spiedget.called.should.be.true;
    });
    it('should call a before route on get', function() {
      spiedget.called.should.be.false;
      var wrapped = handlers.wrap('get', { before: spiedbefore, handler: spiedget });
      wrapped({}, res);
      spiedget.called.should.be.true;
      spiedbefore.called.should.be.true;

    });
  });
});
