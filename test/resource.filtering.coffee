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
  User = mongoose.model('users')
  aMovie = null

  before (done) ->
    app = config.app
    async.times 10, (i, next) ->
      movie = new Movie(FactoryGirl.create('movie'))
      creator = new User(FactoryGirl.create('user'))
      creator.save (err, obj) ->
        movie.creator = obj
        movie.save(next)
        aMovie = movie
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
  it 'should select certain fields from a resource', (done) ->
    testFilter(
      '/movies',
      year: 'y', title: 'n',
      done,
      (res) ->
        res.body.forEach (movie) ->
          movie.should.not.have.property('title')
          movie.should.have.property('year')
    )

  it 'should sort movies by year', (done) ->
    testFilter(
      '/movies',
      sort_by: 'year,desc'
      done,
      (res) ->
        isSorted = _.every res.body, (movie, index, movies) ->
          return index == 0 || movie.year <= movies[index - 1].year
        isSorted.should.be.true
    )

  it 'should filter fields using equal', (done) ->
    testFilter(
      '/movies',
      year: '2011'
      done,
      (res) ->
        _.every res.body, (movie, index, movies) ->
          movie.year.should.equal(2011)
    )

  it 'should filter fields using gte', (done) ->
    testFilter(
      '/movies',
      year: '{gte}2012'
      done,
      (res) ->
        _.every res.body, (movie, index, movies) ->
          movie.year.should.be.above(2011)
    )

  it 'should filter fields using gt', (done) ->
    testFilter(
      '/movies',
      year: '{gt}2011'
      done,
      (res) ->
        _.every res.body, (movie, index, movies) ->
          movie.year.should.be.above(2011)
    )

  it 'should combine numeric operators', (done) ->
    testFilter(
      '/movies',
      year: '{gt}2011{lte}2012'
      done,
      (res) ->
        _.every res.body, (movie, index, movies) ->
          movie.year.should.be.above(2011).and.below(2013)
    )

  it.skip 'should support regex matching', (done) ->
    testFilter(
      '/movies',
      title: '^Title?', per_page: 10
      done,
      (res) ->
        res.body.should.have.length(10)
    )

  it 'should populate an objectId', (done) ->
    testFilter(
      "/movies/#{aMovie._id}",
      populate: 'creator', 'creator': 'y',
      done,
      (res) ->
        res.body.creator.username.should.startWith("test")
    )

    
