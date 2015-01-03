request = require('supertest')

class ApiTester

  constructor: (@app, @root, @factory = (-> {})) ->

  list: () ->
    request(@app)
      .get(@root)

  detail: (id) ->
    request(@app)
      .get("#{@root}/#{id}")

  create: () ->
    request(@app)
      .post(@root)
      .send(@factory())
  
  update: (id, body) ->
    request(@app)
      .put("#{@root}/#{id}")
      .send(body)
  
  destroy: (id) ->
    request(@app)
      .del("#{@root}/#{id}")


class RestfulApiTester extends ApiTester
  listWithLength: (length, cb) ->
    @list()
      .expect(200)
      .end (err, res) ->
        res.body.should.have.lengthOf(length)
        cb(err, res)

  detailWithProperties: (id, hash, cb = undefined) ->
    @detail(id)
      .expect(200)
      .end (err, res) ->
        res.body.should.have.properties(hash)
        cb(err, res) if cb

  createSuccessfully: (cb) ->
    @create()
      .expect(201)
      .end (err, res) ->
        console.log(res.text)
        cb(err)
        
  updateSuccessfully: (id, body, cb) ->
    @update(id, body)
      .expect(204)
      .end (err, res) ->
        console.log(res.text)
        cb(err)
  
  destroySuccessfully: (id, cb) ->
    @destroy(id)
      .expect(204)
      .end (err, res) ->
        res.body.should.be.eql({})
        cb(err, res)

  availableModels: (cb) ->
    @list()
      .end (err, res) ->
        cb(res.body)

module.exports = RestfulApiTester
