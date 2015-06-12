var User = require('./user.schema');
var mongoose = require('../../mongoose');

module.exports = exports = mongoose.Model('User', User);