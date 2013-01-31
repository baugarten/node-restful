module.exports = process.env.RESTFUL_COV
  ? require('./lib-cov/restful')
  : require('./lib/restful');
