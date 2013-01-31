var User = require('../models/user'),
    Note = require('../models/note');

// Here we can add custom route endpoints
exports = module.exports = {
  // an endpoint called notes
  notes: {
    handler: function(req, res, next, err, model) {
      Note.Obj.find({ creator: model._id }, function(err, list) {
        if (err) next({ status: 404 }); // Error handling
        //res.status is the status code
        res.status = 200;

        // res.bundle is what is returned
        res.bundle = list;  
        next();
      });
    },
    detail: true, // detail makes sure we have one model to work on i.e. /user/:id/note is the uri
    methods: ['get'], // only respond to GET requests
  },
}
