var mongoose = require('mongoose'),
    errors = require('../../errors/index'),
    _ = require('lodash');


/**
 * Mongoose schema plugin to add an embedded array with simple tags (String|Number) to a document
 * @param schema
 * @param options
 */
function embeddedTagsPlugin(schema, options) {

    if (!options) options = {};

    var itemType = options.type ? options.type : String;
    var path = options.path ? options.path : 'tags';
    var methodSuffix = options.methodSuffix ? options.methodSuffix : 'Tag';  // getTag, addTag, removeTag
    var allowDuplicates = options.allowDuplicates == null ? false : options.allowDuplicates;
    var filterDuplicates = options.filterDuplicates == null ? false : options.filterDuplicates;


    // Prepare the schema extension and add it
    var tags = {};
    tags[path] = [ itemType ];

    schema.add(tags);


    /**
     * Retrieves an element by its tag, returns errors.ResourceNotFoundError() if not present for easy express handling
     * @param {String|Number} itemValue - the item to retrieve
     * @param {function} callback - callback function receives (error, tag}
     * @returns {*}
     */
    schema.methods['get' + methodSuffix] = function(tag, callback) {

        var tagIdx = this[path].indexOf(tag);

        if (tagIdx < 0) return callback(new errors.ResourceNotFoundError());

        return callback(null, this[path][tagIdx]);
    };


    /**
     * Add a new tag to the embedded collection, if callback is specified model will be saved otherwise it is not saved
     * @param {String|Number} tag - Tag to add
     * @param {function} [callback] - Optional callback, if present forces a save of the document
     * @returns {*}
     */
    schema.methods['add' + methodSuffix] = function(tag, callback) {

        this[path].push(tag);

        if (callback) {
            this.save(function(err){
                return callback(err, tag);
            });
        }
        return this;
    };


    /**
     * Remove an existing tag from the embedded collection, if callback is specified the model will be saved
     * @param {String|Number} tag - Tag to add
     * @param {function} [callback] - Optional callback, if present forces a save of the document
     * @returns {Boolean} - If no callback was given, false is returned when the tag was not removed
     */
    schema.methods['remove' + methodSuffix] = function(tag, callback) {

        var tagIdx = this[path].indexOf(tag);

        if (tagIdx >= 0) this[path].splice(tagIdx, 1);

        if (callback) {

            if (tagIdx < 0) return callback(new errors.ResourceNotFoundError());

            this.save(function(err){
                return callback(err, tag);
            });
        }

        return (tagIdx >= 0);
    };


    /**
     * Update an existing tag inside the embedded collection, if callback is specified the model will be saved
     * @param {String|Number} tag - Tag that needs to be replaced
     * @param {String|Number} newTag - Tag to replace the old with
     * @param {function} [callback] - Optional callback, if present forces a save of the document
     * @returns {Boolean} - If no callback was given, false is returned when the tag was not updated
     */
    schema.methods['update' + methodSuffix] = function(tag, newTag, callback) {

        var tagIdx = this[path].indexOf(tag);

        if (tagIdx >= 0) {
            this.markModified(path); // this would go unnoticed and not persist in the db !
            this[path][tagIdx] = newTag;
        }

        if (callback) {

            if (tagIdx < 0) return callback(new errors.ResourceNotFoundError());

            this.save(function(err){
                return callback(err, newTag);
            });
        }

        return (tagIdx >= 0);
    };


    // Add a pre-save middleware to eliminate duplicates if filterDuplicates was asked
    if ( filterDuplicates ) {

        schema.pre('validate', function (next) {

            var seen = {};
            this[path] = this[path].filter(
                function(element) {
                    if (seen.hasOwnProperty(element)) return false;
                    seen[element] = 1;
                    return true;
                }
            );
            next();
        });
    }

    // Add a pre-save middleware to disallow duplicates if filterDuplicates was asked
    if ( (! filterDuplicates) &&  (! allowDuplicates)) {

        schema.pre('validate', function (next) {

            var self = this;
            var seen = {};

            var allUnique = this[path].every(
                function(element) {
                    if (seen.hasOwnProperty(element)) return false;
                    seen[element] = 1;
                    return true;
                }
            );

            if ( ! allUnique) {
                self.invalidate(path,
                    new mongoose.Error.ValidatorError({
                        path: path,
                        type: 'unique',
                        message: 'Duplicate entries not allowed',
                        value: self[path]
                    })
                )
            }
            next();
        });
    }
}


/*!
 * Export module.
 */

var exports = module.exports;

module.exports = embeddedTagsPlugin;