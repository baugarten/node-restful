Resource = require('../loader')('resource')
Route = require('../loader')('route')
handlers = require('../loader')('handlers')
combinatorics = require('js-combinatorics').Combinatorics
mongoose = require('mongoose')

Model = mongoose.model('temp', mongoose.Schema({}))
noop = (->)

describe 'Resource', ->
  resource = null
  beforeEach ->
    resource = new Resource('resource', Model)

  assertRouteExists = (route, expectedHandler = route.handler) ->
    actual = resource.findRoute(route.path, route.method, route.detail)
    (actual == null).should.be.false
    actual.should.be.an.instanceOf(Route)
    actual.handler.should.equal(expectedHandler) if expectedHandler
    actual

  describe '#withRoutes', ->
    valid_routes = Object.keys(Resource.ALL_ROUTES)
    combinatorics.power(valid_routes).forEach (routes) ->
      it "should succeed with routes #{routes}", ->
        (->
          resource.withRoutes(routes)
        ).should.not.throw()

    it 'should throw when trying to add routes twice', ->
      (->
        resource.withRoutes([])
        resource.withRoutes([])
      ).should.throw('Cannot register built in routes more than once')

    it 'should throw for an unrecognized route', ->
      (->
        resource.withRoutes(['detail', 'blah'])
      ).should.throw("'blah' not recognized as built in route. " +
        'Valid choices are [list,detail,update,create,destroy]')

    it 'should register each route', ->
      resource.withRoutes(valid_routes)
      valid_routes.forEach (routeName) ->
        route = Resource.ALL_ROUTES[routeName]
        assertRouteExists(route)

  describe '#route', ->
    it 'should register when provided only a path and function', ->
      resource.route('blah', noop)
      assertRouteExists
        path: 'blah'
        method: 'get'
        detail: false

    it 'should register when provided a path, method and function', ->
      resource.route('blah', 'post', noop)
      assertRouteExists
        path: 'blah'
        method: 'post'
        detail: false

    it 'should register when provided a path, list of methods and function', ->
      resource.route('blah', ['post', 'delete'], noop)
      ['post', 'delete'].forEach (method) ->
        assertRouteExists
          path: 'blah'
          method: method
          detail: false

    it 'should register a detail route', ->
      resource.route('blah', ['put'], true, noop)
      assertRouteExists
        path: 'blah'
        method: 'put'
        detail: true

  describe '#before and #after', ->
    posting = null
    detailing = null
    beforeEach ->
      resource.route('/posting', 'post', false, noop)
      resource.route('detailing', 'put', true, noop)
      posting = resource.findRoute('posting', 'post', false)
      detailing = resource.findRoute('detailing', 'put', true)

    it 'should add a before to an existing route', ->
      beforeHandler = (->)
      [posting, detailing].forEach (route) ->
        resource.before(route.path, route.method, route.detail, beforeHandler)
        actual = assertRouteExists route
        actual.handlers().should.have.lengthOf(2)
        actual.handlers()[0].should.equal(beforeHandler)

    it 'should add an after to an existing route', ->
      afterHandler = (->)
      [posting, detailing].forEach (route) ->
        resource.after(route.path, route.method, route.detail, afterHandler)
        actual = assertRouteExists route
        actual.handlers().should.have.lengthOf(2)
        actual.handlers()[1].should.equal(afterHandler)

    it 'should throw an error when adding before on an unregistered route', ->
      (->
        resource.before('dontexist', 'get', false, noop)
      ).should.throw("Trying to add before middleware on an " +
        "unregistered route (dontexist,get,isDetail=false)")

    it 'should throw an error when adding after on an unregistered route', ->
      (->
        resource.after('dontexist', 'get', false, noop)
      ).should.throw("Trying to add after middleware on an " +
        "unregistered route (dontexist,get,isDetail=false)")
