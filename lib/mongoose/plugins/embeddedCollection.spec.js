var chai = require("chai"),
    sinon = require("sinon"),
    sinonChai = require("sinon-chai"),
    async = require('async'),
    _ = require('lodash');

expect = chai.expect;
chai.use(sinonChai);



/**************************************************************************
 * Begin of tests
 *************************************************************************/

var app = require('../../../app');
var Schema = require('../schema');
var mongoose = require('mongoose');


describe('Mongoose.Plugin.embeddedCollection', function(){

    var schema, embeddedSchema, Model;

    before(function(){

        embeddedSchema = new Schema({

            name: {
                type: String,
                default: 'test'
            }

        });

        schema = new Schema({

            name : {
                type : String,
                default: 'nothing'
            },

            purchases: [embeddedSchema]
        });

        Schema.Plugin.embeddedCollection(schema, 'Purchase', 'purchases');
        Model = mongoose.model('TestEmbeddedCollectionPlugin', schema);

    });


    before(function(done){
        Model.remove({}, done);
    });



    describe('#embeddedCollectionPlugin()', function(){

        var doc, embedded1, embedded2;

        beforeEach(function(done){
            doc = new Model();
            embedded1 = doc.purchases.create({name: 'embedded1'});
            embedded2 = doc.purchases.create({name: 'embedded2'});
            doc.purchases.push(embedded1);
            doc.purchases.push(embedded2);
            doc.save(done);
        });

        afterEach(function(done){
            Model.remove({}, done);
        });


        it('should be a function', function(){
            expect(Schema.Plugin.embeddedCollection).to.be.a('function');
        });


        describe('adds embedded collection functionality to schemas', function(){


            describe('document#getEmbedded', function(){

                it('is injected as a document method', function(){

                    expect(doc.getPurchase).to.be.a('function');
                });

                it('retrieves an embedded document by its _id', function(done){
                    doc.getPurchase(embedded1._id.toString(), function(err, embDoc){

                        expect(err).to.not.exist;
                        expect(embDoc).to.equal(embedded1);
                        done();
                    });
                });

                it('returns a ResourceNotFoundError for an unknown _id', function(done){
                    doc.getPurchase('whatever', function(err, embDoc){

                        expect(err).to.exist;
                        expect(err).to.have.a.property('name', 'ResourceNotFoundError');
                        expect(embDoc).to.not.exist;
                        done();
                    });
                });

            });


            describe('document#createEmbedded', function(){

                it('is injected as a document method', function(){
                    expect(doc.createPurchase).to.be.a('function');
                });

                it('creates embedded documents and returns them trough the callback', function(done){
                    doc.createPurchase({name: 'new'}, function(err, embDoc){

                        expect(err).to.not.exist;
                        expect(embDoc.name).to.equal('new');
                        expect(embDoc).to.have.a.property('_id');
                        expect(doc.purchases[2]._id).to.equal(embDoc._id);
                        done();
                    });
                });

            });

            describe('document#removeEmbedded', function(){

                it('is injected as a document method', function(){

                    expect(doc.removePurchase).to.be.a('function');
                });

                it('removes embedded documents by their id', function(done){
                    doc.removePurchase(embedded1._id.toString(), function(err){

                        expect(err).to.not.exist;
                        expect(doc.purchases).to.have.length(1);
                        expect(doc.purchases[0]._id).to.equal(embedded2._id);
                        done();
                    });
                });

                it('returns a ResourceNotFoundError for an unknown _id', function(done){
                    doc.removePurchase('whatever', function(err, embDoc){

                        expect(err).to.exist;
                        expect(err).to.have.a.property('name', 'ResourceNotFoundError');
                        expect(doc.purchases).to.have.length(2);
                        done();
                    });
                });

            });


            describe('document#updateEmbedded', function(){

                it('is injected as a document method', function(){

                    expect(doc.updatePurchase).to.be.a('function');
                });

                it('updates embedded documents by their id', function(done){

                    doc.updatePurchase(embedded1._id.toString(), {name: 'totally_new'}, function(err, embDoc){

                        expect(err).to.not.exist;
                        expect(embDoc._id).to.equal(embedded1._id);
                        expect(doc.purchases[0].name).to.equal('totally_new');
                        done();
                    });
                });

                it('returns a ResourceNotFoundError for an unknown _id', function(done){

                    doc.updatePurchase('whatever', {name: 'tt'}, function(err, embDoc){
                        expect(err).to.exist;
                        expect(err).to.have.a.property('name', 'ResourceNotFoundError');
                        done();
                    });
                });

                it('updates embedded documents by their id, and filters _id property', function(done){

                    doc.updatePurchase(embedded1._id,
                            {   _id: "53881fd9ae17710aca44626c",
                                name: 'totally_newer'}, function(err, embDoc){
                        expect(err).to.not.exist;
                        expect(embDoc._id).to.equal(embedded1._id);
                        expect(doc.purchases[0].name).to.equal('totally_newer');
                        done();
                    });
                });

            });
        });

    });

});
