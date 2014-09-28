module.exports = function(module) {
  return process.env.RESTFUL_COV
    ? require('./src-cov/' + module)
    : require('./lib/' + module);
}
