var chai = require("chai"),
    sinon = require("sinon"),
    sinonChai = require("sinon-chai"),
    expect = chai.expect;

var async = require('async'),
    _ = require('lodash');

chai.use(sinonChai);



/**************************************************************************
 * Begin of tests
 *************************************************************************/

var app = require('../../../app');
var Schema = require('../schema');
var mongoose = require('mongoose');


describe('Mongoose.Plugin.transform', function(){

    var schema, Model;


    it('should be a function', function(){

        expect(Schema.Plugin.transform).to.be.a('function');

    });


    describe('toJSON hide', function(){


        it('should inject a transform function into options.toJSON', function(){

            var mockSchema = { options: { test: 1, toJSON: {'test': 2}} };

            Schema.Plugin.transform(mockSchema);

            expect(mockSchema).to.have.a.deep.property('options.test', 1); // make sure it keeps other options intact
            expect(mockSchema).to.have.a.deep.property('options.toJSON.test', 2); // make sure it keeps other options intact
            expect(mockSchema).to.have.a.deep.property('options.toJSON.transform')

        });


        it('should hide 1st level keys', function(){

            var mockSchema = {
                options: {
                    toJSON: {hide: 'key1 key2'}
                }
            };
            Schema.Plugin.transform(mockSchema);

            var ret = {key1: 1, key2: 2, key3: 3};
            mockSchema.options.toJSON.transform(

                {},                             // document
                ret,                            // return data
                mockSchema.options.toJSON       // options
            )

            expect(ret).to.not.have.a.property('key1');
            expect(ret).to.not.have.a.property('key2');
            expect(ret).to.have.a.property('key3', 3);
        });


        it('should hide multi level keys', function(){

            var mockSchema = {
                options: {
                    toJSON: { hide: 'key1.key2 key4' }
                }
            };
            Schema.Plugin.transform(mockSchema);

            var ret = {
                key1: {
                    key2 : 'byebye',
                    key3 : 'dontkillme'
                },
                key2: 2,
                key3: 3,
                key4: 4
            };
            mockSchema.options.toJSON.transform(

                {},                             // document
                ret,                            // return data
                mockSchema.options.toJSON       // options
            )

            expect(ret).to.not.have.a.property('key1.key2');
            expect(ret).to.have.a.deep.property('key1.key3', 'dontkillme');
            expect(ret).to.have.a.deep.property('key2', 2);
            expect(ret).to.have.a.deep.property('key3', 3);
            expect(ret).to.not.have.a.deep.property('key4');
        });

    });

});
