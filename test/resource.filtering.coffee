_ = require('underscore')
should = require('should')
async = require('async')
request = require('supertest')
mongoose = require('mongoose')
querystring = require('querystring')
config = require('./fixtures/config')
FactoryGirl = require('factory_girl')
checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$')
RestfulApiTester = require('./helper')

describe 'Resource#filtering', ->
  app = null
  Movie = mongoose.model('movies')

  before (done) ->
    app = config.app
    async.times 100, (i, next) ->
      movie = new Movie(FactoryGirl.create('movie'))
      movie.save(next)
    , done

  testFilter = (baseUrl, filter, done, callback) ->
    async.parallel [
      (done) -> 
        request(app)
          .get("#{baseUrl}?#{querystring.stringify(filter)}")
          .end(done)
    , (done) -> 
        request(app)
          .get("#{baseUrl}")
          .send(filter)
          .end(done)
    ], (err, results) ->
      _.each(results, callback)
      done()

  it 'should limit result set to 10', (done) ->
    testFilter(
      '/movies',
      limit: '10',
      done,
      (res) ->
        res.body.length.should.equal(10)
    )

  it 'should get page 2', (done) ->
    request(app)
      .get('/movies?limit=10')
      .end (err, res) ->
        expectedMovies = res.body.slice(5, 10)
        testFilter(
          '/movies',
          page: '2', per_page: '5'
          done,
          (res) ->
            res.body.should.eql(expectedMovies)
        )
