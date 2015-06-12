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
var multisetPlugin = require('./multiset');
var mongoose = require('mongoose');


describe('Mongoose.Plugin.multiset', function(){

    var schema, Model;

    before(function(){

        schema = new mongoose.Schema({

            name : {
                type : String,
                default: 'nothing'
            },

            data : {
                first : {type: String},
                sub : {}
            },

            __v: {type: Number, default: 199},
            updatedAt : {type: String},
            createdAt : {type: String}
        });

        multisetPlugin(schema);
        Model = mongoose.model('TestMultiSetPlugin', schema);

    });



    describe('#multiSetPlugin()', function(){


        before(function(done){

            if ('testmultisetplugins' in mongoose.connection.collections) {

                mongoose.connection.collections['testmultisetplugins'].drop(function(err){

                    if (err && err.errmsg == 'ns not found') {

                        return done();
                    }
                    done(err);
                });

            } else {
                done();
            }

        });



        it('should be a function', function(){

            expect(multisetPlugin).to.be.a('function');

        });


        describe('adds multiSet functionality to schemas', function(done){

            afterEach(function(done){
                Model.remove({}, done);
            });


            it('injects a document#multiSet() method', function(){
                var doc = new Model({});
                expect(doc.multiSet).to.be.a('function');
            });


            it('allows to set multiple values at once', function() {
                var doc = new Model({name: 'test', data: {first: 'test'}});

                expect(doc).to.have.a.deep.property('name', 'test');
                expect(doc).to.have.a.deep.property('data.first', 'test');
                expect(doc).to.have.a.deep.property('__v', 199);

                doc.multiSet({name: 'test2', data: {sub: { test: 1}}});

                expect(doc).to.have.a.deep.property('name', 'test2');
                expect(doc).to.have.a.deep.property('data.first', 'test'); // not overwritten
                expect(doc).to.have.a.deep.property('data.sub.test', 1);
                expect(doc).to.have.a.deep.property('__v', 199);

            })


            it('prevents modification of id, _id, __v, createdAt and updatedAt', function() {

                var doc = new Model({name: 'test', createdAt: 'justnow', updatedAt:'justnow'});

                var currentId = doc._id.toString();

                doc.multiSet({
                    name: 'changed',
                    id: '537b03bb4c3c4eb17ec61724',
                    _id: '537b03bb4c3c4eb17ec61724',
                    __v: 1,
                    createdAt: 'now',
                    updatedAt:'now'
                });

                expect(doc).to.have.a.deep.property('name', 'changed');
                expect(doc._id.toString()).to.equal(currentId);
                expect(doc).to.have.a.deep.property('__v', 199);
                expect(doc).to.have.a.deep.property('createdAt', 'justnow');
                expect(doc).to.have.a.deep.property('updatedAt', 'justnow');

            });

        });

    });

});
