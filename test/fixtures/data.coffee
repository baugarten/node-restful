FactoryGirl = require('factory_girl')
ObjectId = require('mongodb').ObjectID

FactoryGirl.sequence 'username', (id) ->
  "test #{id}"

FactoryGirl.sequence 'movie_title', (id) ->
  "Title#{id}"

FactoryGirl.define 'user', ->
  @_id = new ObjectId()
  @sequence('username', 'username')
  @pass_hash = 12374238719845134515

MOVIE_YEARS = [2009,2010,2011,2012,2013,2014]
FactoryGirl.define 'movie', ->
  @_id = new ObjectId()
  @sequence('movie_title', 'title')
  @year = MOVIE_YEARS[Math.floor(Math.random() * MOVIE_YEARS.length)]
  @meta =
    productionco: "idk#{Math.floor(Math.random() * 5)}"
  @hasOne('user', 'director')
  @meta.director = @director
  @hasOne('user', 'creator')


#exports.users = FactoryGirl.createLists('user', 2)
#exports.movies = FactoryGirl.createLists('movie', 100)

