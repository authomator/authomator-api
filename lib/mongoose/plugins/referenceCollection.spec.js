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
var Model = require('../model');
var mongoose = require('mongoose');


describe('Mongoose.Plugin.referenceCollection', function(){

    var carSchema, Car;
    var carTypeSchema, CarType, carTypeId1, carTypeId2;

    // Remove cartypes collection if it exists
    //
    before(function(done){

        if ('cartypes' in mongoose.connection.collections) {

            mongoose.connection.collections['cartypes'].drop(function(err){

                if (err && err.errmsg == 'ns not found') {

                    return done();
                }
                done(err);
            });

        } else {
            done();
        }
    });


    // Remove cars collection if it exists
    //
    before(function(done){

        if ('cars' in mongoose.connection.collections) {

            mongoose.connection.collections['cars'].drop(function(err){

                if (err && err.errmsg == 'ns not found') {

                    return done();
                }
                done(err);
            });

        } else {
            done();
        }
    });
    
    // Create the cartypes mongoose schema and model to store the referenced documents
    //
    before(function() {
        carTypeSchema = new Schema({
            name: {
                type: String,
                default: 'nothing'
            }
        });
        CarType = Model('CarType', carTypeSchema);
    });

    // Create the cars mongoose schema and model to store the documents that will
    // be storing references to the docs above
    //
    before(function(){
        carSchema = new Schema({
            name : {
                type : String,
                default: 'nothing'
            }
        });
        Schema.Plugin.referenceCollection(carSchema, 'CarType', 'types', true, true);
        Car = Model('Car', carSchema);
    });

    
    

    // Create a race car type
    before(function(done){
        var doc = new CarType({name: 'race'});
        carTypeId1 = doc._id;
        doc.save(done);
    });

    // Create a family car type
    before(function(done){
        var doc = new CarType({name: 'family'});
        carTypeId2 = doc._id;
        doc.save(done);
    });


    describe('#referenceCollectionPlugin()', function(){


        it('should be a function', function(){

            expect(Schema.Plugin.referenceCollection).to.be.a('function');

        });


        describe('adds reference collection and functionality to schemas', function(done){

            afterEach(function(done){

                Car.remove({}, done);

            });

            it('injects a reference collection property', function(done){

                var doc = new Car({});
                doc.save(function(err){
                    expect(err).to.not.exist;
                    expect(doc).to.have.a.property('types');
                    expect(doc.types).to.be.an('array');
                    done();
                });
            });


            it('allows adding references to the reference collection property', function(done){

                var doc = new Car({});

                doc.types.push({_id: carTypeId1});
                doc.types.push({_id: carTypeId2});

                doc.save(function(err){
                    expect(err).to.not.exist;
                    expect(doc.types).to.have.length(2);
                    expect(doc.types[0]).to.equal(carTypeId1);
                    expect(doc.types[1]).to.equal(carTypeId2);
                    done();
                });

            });


            it('injects a document#addReference method', function(){
                var doc = new Car({});
                expect(doc.addCarType).to.be.a('function');
            });

            it('injects a document#removeReference method', function(){
                var doc = new Car({});
                expect(doc.removeCarType).to.be.a('function');
            });

        });

        describe('document methods', function(){

            var doc;

            describe('#addReference()', function(){

                it('adds a reference entry to the document.references collection property', function(done){

                    doc = new Car({});

                    doc.addCarType(carTypeId1, function(err, carTypeDoc){

                        expect(err).to.not.exist;
                        expect(doc.types).to.have.length(1);
                        expect(doc.types[0].toString()).to.equal(carTypeId1.toString());

                        expect(carTypeDoc._id.toString()).to.equal(carTypeId1.toString());
                        done();
                    })
                });


                it('returns an ResourceNotFoundError if an unknown reference id is passed', function(done){

                    doc = new Car({});

                    doc.addCarType('53771889fc41040000d80fa4', function(err, carTypeDoc){

                        expect(err).to.exist;
                        expect(err).to.have.a.property('message', 'Resource not found');
                        expect(err).to.have.a.property('name', 'ResourceNotFoundError');

                        expect(doc.types).to.have.length(0);
                        expect(carTypeDoc).to.not.exist;
                        done();
                    });
                });


                it('does not allow duplicate references to be added', function(done){

                    doc = new Car({});

                    async.series([

                        function first(done) {

                            doc.addCarType(carTypeId1, function(err, carTypeDoc){

                                expect(err).to.not.exist;
                                expect(doc.types).to.have.length(1);
                                expect(doc.types[0].toString()).to.equal(carTypeId1.toString());

                                expect(carTypeDoc._id.toString()).to.equal(carTypeId1.toString());
                                done();
                            })

                        },

                        function duplicate(done) {

                            doc.addCarType(carTypeId1, function(err, carTypeDoc){

                                expect(err).to.exist;
                                expect(err.message).to.equal('Car validation failed');
                                expect(err.name).to.equal('ValidationError');
                                expect(err).to.have.a.deep.property('errors.types.message',
                                    'This entry is already present');
                                expect(err).to.have.a.deep.property('errors.types.kind', 'unique');
                                done();
                            })

                        }

                    ], done);

                });

            });



            describe('#removeReference()', function(){

                var doc;

                before(function(done){

                    doc = new Car({});

                    doc.types.push({_id: carTypeId1});
                    doc.types.push({_id: carTypeId2});

                    doc.save(done);
                });


                it('removes a reference entry from the document.references collection property', function(done){


                    doc.removeCarType(carTypeId2, function(err){

                        expect(err).to.not.exist;
                        expect(doc.types).to.have.length(1);
                        expect(doc.types[0].toString()).to.equal(carTypeId1.toString());
                        done();
                    })
                });


                it('returns an ResourceNotFoundError if a reference id is passed that is not present', function(done){

                    doc.removeCarType(carTypeId2, function(err){

                        expect(err).to.exist;
                        expect(err).to.have.a.property('message', 'Resource not found');
                        expect(err).to.have.a.property('name', 'ResourceNotFoundError');
                        done();
                    })

                });

            });

        });

    });

});
