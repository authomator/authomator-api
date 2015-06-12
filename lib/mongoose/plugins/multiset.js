var _ = require('lodash');

/**
 * Schema plugin to add multiSet method to document
 *
 * @param {mongoose.Schema} schema -
 */

module.exports = exports = function multiSetPlugin(schema) {

    schema.methods.multiSet = function(data) {

        if (_.isObject(data)) {
            delete data.id;
            delete data._id;
            delete data.__v;
            delete data.updatedAt;
            delete data.createdAt
        }

        this.set(data);
    }
}

