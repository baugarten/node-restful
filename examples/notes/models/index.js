var User = require('./user'),
    Notes = require('./note'),
    userroutes = require('../routes/user');

console.log(userroutes);
for (var route in userroutes) {
  User.userroute(route, userroutes[route]);
}

exports = module.exports = [User, Notes];

