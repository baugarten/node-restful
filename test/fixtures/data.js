var ObjectId = require('mongodb').ObjectID;

exports.users = [
  {
    _id: new ObjectId(),
    username: "test",
    pass_hash: 12374238719845134515,
  },
  {
    _id: new ObjectId(),
    username: "test2",
    pass_hash: 1237987381263189273123,
  }
];

exports.movies = [
  {
    _id: new ObjectId(),
    title: "Title1",
    year: 2012,
    meta: {
      productionco: "idk",
      director: exports.users[1]._id,
    },
    creator: exports.users[0]._id,
    secret: "A SECRET STRING",
  },
  {
    _id: new ObjectId(),
    title: "Title2",
      year: 2011
  },
  {
    _id: new ObjectId(),
    title: "Title3",
      year: 2013
  },
  {
    _id: new ObjectId(),
    title: "Title4",
      year: 2013
  },
  {
    _id: new ObjectId(),
    title: "Title5",
      year: 2013
  },
  {
    _id: new ObjectId(),
    title: "Title6",
      year: 2010
  },
  {
    _id: new ObjectId(),
    title: "Title7",
      year: 2011
  },
  {
    _id: new ObjectId(),
    title: "Title8",
      year: 2012
  },
  {
    _id: new ObjectId(),
    title: "Title9",
      year: 2010
  },
  {
    _id: new ObjectId(),
    title: "Title10",
      year: 2011
  },
  {
    _id: new ObjectId(),
    title: "Title11",
      year: 2012
  },
  {
    _id: new ObjectId(),
    title: "Title12",
      year: 2010
  },
  {
    _id: new ObjectId(),
    title: "Title13",
      year: 2011
  },
  {
    _id: new ObjectId(),
    title: "Title14",
      year: 2009
  }
];

exports.reviews = [
  {
    _id: new ObjectId(),
    body: "This is a movie review!",
    length: 127
  }
];
