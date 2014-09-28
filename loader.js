module.exports = function(module) {
  return process.env.RESTFUL_COV
    ? require('./lib-cov/' + module)
    : require('./lib/' + module);
}
