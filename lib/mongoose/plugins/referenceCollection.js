var mongoose = require('mongoose'),
    errors = require('../../errors/index'),
    _ = require('lodash');




function referenceCollectionPlugin(schema, modelName, propertyName, addIndex, enforceUnique){

    if (! (schema && modelName && propertyName) ){
        throw new Error('Missing parameters in referenceCollectionPlugin');
    }

    // By default enable indexing
    addIndex = (addIndex == undefined) ? true : addIndex;

    // By default enforce unique _id validation
    enforceUnique = (enforceUnique == undefined) ? true : enforceUnique;


    // Extend the passed schema with an array of ObjectId
    //
    var newProperty = {};
    newProperty[propertyName] = [
        {
            // The Artist objectId reference
            type : mongoose.Schema.Types.ObjectId,
            ref : modelName
        }
    ];
    schema.add(newProperty);


    // Enable indexing
    if (addIndex) enableIndexing(schema, propertyName);

    // Inject #add<Object>()
    injectFunctionAddObject(schema, modelName, propertyName);

    // Inject #remove<Object>()
    injectFunctionRemoveObject(schema, modelName, propertyName);

    // Inject unique validator on collection
    if (enforceUnique) injectUniqueValidator(schema, propertyName, modelName);

}



/**
 * Enables indexing on the reference Collection
 * @param {mongoose.Schema} schema - schema instance to inject in
 * @param {String} propertyName - propertyName of the array in the schema
 */
function enableIndexing(schema, propertyName) {

    var idx = {};
    idx[propertyName] = 1;

    schema.index(idx);

}



/**
 * Injects the #addObject() method for easy addition of a referenced objects, i.e addArtist
 * @param {mongoose.Schema} schema - schema instance to inject in
 * @param {String} modelName - name of the model i.e 'Artist'
 * @param {String} propertyName - propertyName of the array in the schema
 */
function injectFunctionAddObject(schema, modelName, propertyName){

    schema.methods['add' + modelName] = function(id, callback) {

        var self = this;

        self.model(modelName).findById(id, function (err, doc) {

            if (err) return callback(err);

            if (! doc) return callback(new errors.ResourceNotFoundError());

            self[propertyName].push(doc._id);

            self.save(function(err){
                callback(err, doc);
            });

        });

    }

}



/**
 * Injects the #removeObject() method for easy removal of referenced objects, i.e removeArtist
 * @param {mongoose.Schema} schema - schema instance to inject in
 * @param {String} modelName - name of the model i.e 'Artist'
 * @param {String} propertyName - propertyName of the array in the schema
 */
function injectFunctionRemoveObject(schema, modelName, propertyName){

    schema.methods['remove' + modelName] = function(id, callback) {

        var self = this;

        var found = _.filter(self[propertyName], function(objectId){
            return (objectId.toString() == id);
        });

        if (found.length < 1) return callback(new errors.ResourceNotFoundError());

        self[propertyName].pull(found[0]);

        self.save(callback);

    }

}



/**
 * Injects a unique validator as pre('validate') middleware on the specified propertyName
 * @param {mongoose.Schema} schema - schema instance to inject in
 * @param {String} propertyName - propertyName of the array in the schema that requires unique validation
 * @param {String} modelName - name of the model i.e 'Artist'
 */
function injectUniqueValidator(schema, propertyName, modelName) {

    /**
     * Ensure no duplicate entries exist in the reference
     */
    schema.pre('validate', function(next) {

        var self = this;
        var seen = {};

        _.forEach(self[propertyName], function(objectId){

            if (objectId in seen) {

                self.invalidate(propertyName,
                    new mongoose.Error.ValidatorError({
                        path: modelName.toLowerCase() + 'Id', 
                        message: 'This entry is already present',
                        type: 'unique', 
                        value: objectId
                    })
                );
                return false; // exit loop prematurely
            }
            seen[objectId] = 1;

        });

        next();

    });

}



/*!
 * Export module.
 */

var exports = module.exports;

module.exports = referenceCollectionPlugin;

