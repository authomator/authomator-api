/*
    Simple proxy export to mongoose.model to keep things a bit organized
 */

var mongoose = require('mongoose');

module.exports = exports = mongoose.model.bind(mongoose);