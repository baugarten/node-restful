should = require("should")
mongoose = require("mongoose")
request = require("supertest")
config = require("./fixtures/config")
sinon = require("sinon")
FactoryGirl = require('factory_girl')
checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$")
oldA = should.Assertion::a

should.Assertion::a = (type, desc) ->
  if type is "_id"
    @assert checkForHexRegExp.test(@obj),
      -> "expected #{@inspect} to be an #{type}" +
        ((if desc then " | " + desc else ""))
    , -> "expected #{@inspect} not to be an #{type}" +
        ((if desc then " | " + desc else ""))
    @
  oldA.call @, type, desc


describe "Model", ->
  app = null

  before (done) ->
    config.ready ->
      app = config.app
      done()

  getUsers = (path) ->
    request(app)
      .get("/users#{path}")

  postUsers = (user) ->
    (done) ->
      request(app)
        .post("/users")
        .send(user)
        .expect 201, done

  expectUsersList = (num) ->
    (cb) ->
      getUsers('')
        .expect("Content-Type", /json/)
        .expect(200)
        .end (err, res) ->
          res.body.should.have.lengthOf(num)
          cb(err)

  describe "handlers", ->
    it.skip "should handle schema request for users", (done) ->
      getUsers("/schema")
        .expect("Content-Type", /json/)
        .expect(200)
        .end (err, res) ->
          res.body.resource.should.equal "users"
          res.body.fields.should.be.a "object"
          done()

    it "should GET a list of 0 users", expectUsersList(0)

    it "should POST a user", postUsers(FactoryGirl.create('user'))

    it "should GET a list of 1 users", expectUsersList(1)

