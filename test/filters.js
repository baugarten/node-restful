var should = require('should');
var filters = require('../lib/filters');

var query = {
  "model": {
    "schema": {
      "paths": {
        "username": true
      }
    }
  } 
};

describe('filters', function() {
  it('should have all the expected keys', function() {
    filters.filters.should.have.keys(['populate', 'limit', 'skip', 'offset', 'select', 'sort']);
    filters.subfilters.should.have.keys(['equals', 'gte', 'gt', 'lt', 'lte', 'ne', 'regex', 'in']);
  });

  it('should contain all the expected keys', function() {
    filters.contains('populate', true, query).should.be.true;
    filters.contains('limit', false, query).should.be.true;
    filters.contains('skip', false, query).should.be.true;
    filters.contains('username__gte', false, query).should.be.true;
    filters.contains('username__regex', false, query).should.be.true;
    filters.contains('username__in', false, query).should.be.true;
  });
});
