var mongoose = require('mongoose');

module.exports = exports;


exports.Schema = require('./schema');
exports.Model = require('./model');
exports.Error = require('mongoose').Error;

exports.setup = function(config) {
    console.log('Connecting to mongo db ' + config.mongoose.url);
    mongoose.connect(config.mongoose.url, config.mongoose.options);
}