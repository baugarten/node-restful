var restful = require('../../')
var mongoose = require('mongoose'),
    user,
    userobjs = [],
    opts = {
      title: "users",
      methods: ['get', 'post', 'put', 'delete'],
      schema: mongoose.Schema({
        username: { type: 'string', required: true },
        pass_hash: { type: 'number', required: true },
      }),
      delete: {
        sort: false
      }
    };

exports.register = function(app) {
  var users = [{
        username: "test",
        pass_hash: 12374238719845134515,
      }, {
        username: "test2",
        pass_hash: 1237987381263189273123,
      }],
      userobjs = [];
  user = new restful.Model(opts); 
  user.register(app, '/users');
  users.forEach(function(useropts) {
    var obj = new user.Obj(useropts);
    obj.save();
    userobjs.push(obj);
  });
  exports.user = user;
  exports.users = userobjs;
  return exports;
}

exports.user = user;
exports.users = userobjs;
