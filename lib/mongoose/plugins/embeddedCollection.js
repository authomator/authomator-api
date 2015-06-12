var mongoose = require('mongoose'),
    errors = require('../../errors/index');


/**
 * Schema plugin to add embedded collection utility methods to a document
 *
 */

function embeddedCollectionPlugin(schema, schemaName, propertyName){


    // Inject #get<Object>()
    injectFunctionGetObject(schema, schemaName, propertyName);


    // Inject #create<Object>()
    injectFunctionCreateObject(schema, schemaName, propertyName);


    // Inject #remove<Object>()
    injectFunctionRemoveObject(schema, schemaName, propertyName);


    // Inject #update<Object>()
    injectFunctionUpdateObject(schema, schemaName, propertyName);


}



/**
 * Injects the #getObject() method for easy retrieval of an embedded objects, i.e getPurchase
 * conveniently returns ResourceNotFoundError if id is not found for easy express usage
 *
 * @param {mongoose.Schema} schema - schema instance to inject in
 * @param {String} modelName - name of the embeddedModel i.e 'Purchase'
 * @param {String} propertyName - propertyName of the array in the schema where the embedded documents live
 */
function injectFunctionGetObject(schema, modelName, propertyName){

    schema.methods['get' + modelName] = function(id, callback) {

        var doc = this[propertyName].id(id);

        if (! doc) return callback(new errors.ResourceNotFoundError());

        callback(null, doc);
    }

}


/**
 * Injects the #createObject() method for easy addition of an embedded objects, i.e addPurchase
 * @param {mongoose.Schema} schema - schema instance to inject in
 * @param {String} modelName - name of the embeddedModel i.e 'Purchase'
 * @param {String} propertyName - propertyName of the array in the schema where the embedded documents live
 */
function injectFunctionCreateObject(schema, modelName, propertyName){

    schema.methods['create' + modelName] = function(data, callback) {

        var self = this;

        var newDoc = self[propertyName].create();
        newDoc.multiSet(data);
        self[propertyName].push(newDoc);

        self.save(function(err){
            callback(err, newDoc);
        });

    }

}

/**
 * Injects the #removeObject() method for easy removal of an embedded objects, i.e removePurchase
 * conveniently returns ResourceNotFoundError if id is not found for easy express usage
 *
 * @param {mongoose.Schema} schema - schema instance to inject in
 * @param {String} modelName - name of the embeddedModel i.e 'Purchase'
 * @param {String} propertyName - propertyName of the array in the schema where the embedded documents live
 */
function injectFunctionRemoveObject(schema, modelName, propertyName){

    schema.methods['remove' + modelName] = function(id, callback) {

        var self = this;

        self['get' + modelName](id, function(err, doc){

            if (err) return callback(err);

            doc.remove();
            self.save(callback);
        });

    }

}


/**
 * Injects the #updateObject() method for easy updating of an embedded objects, i.e updatePurchase
 * conveniently returns ResourceNotFoundError if id is not found for easy express usage
 *
 * @param {mongoose.Schema} schema - schema instance to inject in
 * @param {String} modelName - name of the embeddedModel i.e 'Purchase'
 * @param {String} propertyName - propertyName of the array in the schema where the embedded documents live
 */
function injectFunctionUpdateObject(schema, modelName, propertyName){

    schema.methods['update' + modelName] = function(id, data, callback) {

        var self = this;

        self['get' + modelName](id, function(err, doc){

            if (err) return callback(err);

            doc.multiSet(data);
            self.save(function(err){
                callback(err, doc);
            });
        });

    }

}






/*!
 * Export module.
 */

var exports = module.exports;

module.exports = embeddedCollectionPlugin;