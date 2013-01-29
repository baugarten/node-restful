var http = require('http');

var res = module.exports = {
  __proto__: http.ServerResponse.prototype
}

var oldend = res.end;
res.end = function() {
  this.emit('closing', this);
  this._statusCode && this.writeHead(this._statusCode, { 'Content-Type': 'application/json' }); 
  this.content && this.content && this.write(JSON.stringify(this.content));
  oldend.apply(this, arguments);
}
