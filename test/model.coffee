should = require('should')
config = require('./fixtures/config')
FactoryGirl = require('factory_girl')
checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$')
RestfulApiTester = require('./helper')

describe 'Model', ->
  app = null
  userTester = null

  before (done) ->
    config.ready ->
      app = config.app
      userTester = new RestfulApiTester app, '/users', ->
        FactoryGirl.create('user')
      done()

  describe 'handlers', ->
    it.skip 'should handle schema request for users', (done) ->
      getUsers('/schema')
        .expect('Content-Type', /json/)
        .expect(200)
        .end (err, res) ->
          res.body.resource.should.equal 'users'
          res.body.fields.should.be.a 'object'
          done()

    it 'should GET a list of 0 users', (done) ->
      userTester.listWithLength(0, done)

    it 'should POST a user', (done) ->
      userTester.createSuccessfully(done)

    it 'should GET a list of 1 users', (done) ->
      userTester.listWithLength(1, done)

    it 'should GET details for a single user', (done) ->
      userTester.availableModels (users) ->
        userTester.detailWithProperties users[0]._id,
          users[0],
          done

    it 'should PUT a user', (done) ->
      userTester.availableModels (users) ->
        userTester.updateSuccessfully users[0]._id,
          username: 'whoah, another username',
          done

    it 'should GET details for a single user', (done) ->
      userTester.availableModels (users) ->
        users[0].username.should.be.equal('whoah, another username')
        userTester.detailWithProperties users[0]._id,
          users[0],
          done

    it 'should DELETE the user', (done) ->
      userTester.availableModels (users) ->
        userTester.destroySuccessfully users[0]._id, done

    it 'should GET a list of 0 users', (done) ->
      userTester.listWithLength(0, done)

