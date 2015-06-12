var plugins = require('./plugins/index'),
    mongoose = require('mongoose'),
    _ = require('lodash'),

    defaultSchemaOptions = {
        autoIndex : true, // Add indexes on startup
        id        : true, // Add virtual id getter (to _id)
        _id       : true, // Auto generate _id
        safe      : true, // Pass back all errors
        strict    : true, // Only save values defined in schema
        versionKey: '__v' // Important for updates that operate on stale instance
    };

/**
 * This wraps the schema creation to add default schemaPlugin and
 * options when creating new mongoose schemas
 *
 *
 * @param {Object} schema - The schema definition, passed straight to mongoose.Schema
 * @param {Object} options - The options to pass to schema, merged with our defaults in schemaOptions
 */
function Schema(schema, options) {

    var opts = _.extend({}, defaultSchemaOptions, options);

    mongoose.Schema.call(this, schema, opts);

    this.plugin(plugins.timestamps);
    this.plugin(plugins.multiset);
    this.plugin(plugins.transform);
}

Schema.prototype = mongoose.Schema.prototype;

/*!
 * Expose subclasses
 */
module.exports = exports = Schema;

exports.Plugin = plugins;