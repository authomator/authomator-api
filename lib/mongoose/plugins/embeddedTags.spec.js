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
var tagPlugin = require('./embeddedTags');
var mongoose = require('mongoose');


describe('Mongoose.Plugin.tags', function(){


    describe('#tagsPlugin()', function(){


        before(function(done){

            if ('testtagsplugins' in mongoose.connection.collections) {

                mongoose.connection.collections['testtagsplugins'].drop(function(err){

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

            expect(tagPlugin).to.be.a('function');

        });


        describe('tags collection', function(done){


            it('adds #tags property when using the defaults', function(){

                var schema = new mongoose.Schema({
                    name: String
                });
                schema.plugin(tagPlugin);
                expect(schema.paths).to.have.a.property('tags');
            });

            it('adds a #[custom] property when using path in the options', function(){

                var schema = new mongoose.Schema({
                    name: String
                });
                schema.plugin(tagPlugin, {path: 'stefan'});
                expect(schema.paths).to.have.a.property('stefan');
            });

        });


        describe('getter functionality', function() {

            it('adds #getTag() getter when using the plugin defaults', function(){
                var schema = new mongoose.Schema({
                    name: String
                });
                schema.plugin(tagPlugin);
                expect(schema.methods).to.have.a.property('getTag');
                expect(schema.methods.getTag).to.be.a('function');
            });

            it('adds #get[Custom]() getter when using methodSuffix in the options', function(){
                var schema = new mongoose.Schema({
                    name: String
                });
                schema.plugin(tagPlugin, {methodSuffix: 'Marks'});
                expect(schema.methods).to.have.a.property('getMarks');
                expect(schema.methods.getMarks).to.be.a('function');
            });

            it('returns error.NotFound if tag is not found for easy express handling', function(done){
                var schema = new mongoose.Schema({
                    name: String
                });
                schema.plugin(tagPlugin);
                var Model = mongoose.model('tagPluginGetter', schema);
                doc = new Model({name:'test'});
                doc.getTag('testTag', function(err){
                    expect(err).to.exist;
                    expect(err).to.have.a.property('name', 'ResourceNotFoundError');
                    expect(err).to.have.a.property('message', 'Resource not found');
                    Model.remove({}, done);
                });
            });
        });


        describe('setter functionality', function() {

            var schema, Model;

            before(function(){
                schema = new mongoose.Schema({
                    name: String
                });
                schema.plugin(tagPlugin, {type: Number});
                Model = mongoose.model('tagPluginSetter', schema);

            })

            after(function(done){
                Model.remove({}, done);
            });

            it('adds #addTag() setter when using the plugin defaults', function(){
                var schema = new mongoose.Schema({
                    name: String
                });
                schema.plugin(tagPlugin);
                expect(schema.methods).to.have.a.property('addTag');
                expect(schema.methods.addTag).to.be.a('function');
            });

            it('adds #add[Custom]() setter when using methodSuffix in the options', function(){
                var schema = new mongoose.Schema({
                    name: String
                });
                schema.plugin(tagPlugin, {methodSuffix: 'Marks'});
                expect(schema.methods).to.have.a.property('addMarks');
                expect(schema.methods.addMarks).to.be.a('function');
            });

            it('adds items to the collection', function(){
                doc = new Model({name:'test'});
                doc.addTag(10);
                expect(doc.tags).to.be.an('array');
                expect(doc.tags).to.have.length(1);
                expect(doc.tags).to.contain(10);
            });

            it('adds items to the collection and saves it if a callback is provided', function(done){
                doc = new Model({name:'test'});
                doc.addTag(20, function(err, tag){
                    expect(err).to.not.exist;
                    expect(tag).to.equal(20);
                    Model.findById(doc._id).count(function(err, count){
                        expect(err).to.not.exist;
                        expect(count).to.equal(1);
                        done();
                    });
                });
            });
        });


        describe('remove functionality', function() {

            var schema, Model;

            before(function(){
                schema = new mongoose.Schema({
                    name: String
                });
                schema.plugin(tagPlugin);
                Model = mongoose.model('tagPluginRemover', schema);
            })

            after(function(done){
                Model.remove({}, done);
            });


            it('adds #removeTag() setter when using the plugin defaults', function(){
                var schema = new mongoose.Schema({
                    name: String
                });
                schema.plugin(tagPlugin);
                expect(schema.methods).to.have.a.property('removeTag');
                expect(schema.methods.removeTag).to.be.a('function');
            });

            it('adds #remove[Custom]() setter when using methodSuffix in the options', function(){
                var schema = new mongoose.Schema({
                    name: String
                });
                schema.plugin(tagPlugin, {methodSuffix: 'Marks'});
                expect(schema.methods).to.have.a.property('removeMarks');
                expect(schema.methods.removeMarks).to.be.a('function');
            });

            it('removes items from the collection', function(){
                var doc = new Model({name:'test'});
                doc.addTag('testTag');
                expect(doc.tags).to.be.an('array');
                expect(doc.tags).to.have.length(1);
                expect(doc.tags).to.contain('testTag');
                expect(doc.removeTag('testTag')).to.be.true; // successfully removed
                expect(doc.removeTag('testTag')).to.be.false; // not present anymore
                expect(doc.tags).to.be.an('array');
                expect(doc.tags).to.have.length(0);
            });


            it('removes items from the collection and saves to database when callback is given', function(done){

                var doc;

                async.series([

                    function(done){
                        doc = new Model({name:'test'});
                        doc.addTag('testTag1');
                        doc.addTag('testTag2');
                        doc.addTag('testTag3');
                        doc.save(done);
                    },

                    function(done){
                        doc.removeTag('testTag2', done);
                    },

                    function(done){
                        Model.findById(doc._id, function(err, refresh){
                            expect(refresh).to.exist;
                            doc = refresh;
                            done(err);
                        });
                    },

                    function(done){
                        expect(doc.tags).to.be.an('array');
                        expect(doc.tags).to.have.length(2);
                        expect(doc.tags).to.contain('testTag1');
                        expect(doc.tags).to.contain('testTag3');
                        done();
                    }

                ], done);

            });


            it('returns error.NotFound if tag is not found for easy express handling', function(done){
                doc = new Model({name:'test'});
                doc.removeTag('testTag', function(err){
                    expect(err).to.exist;
                    expect(err).to.have.a.property('name', 'ResourceNotFoundError');
                    expect(err).to.have.a.property('message', 'Resource not found');
                    done();
                });

            });

        });


        describe('update functionality', function() {

            var schema, Model;

            before(function(){
                schema = new mongoose.Schema({
                    name: String
                });
                schema.plugin(tagPlugin);
                Model = mongoose.model('tagPluginUpdater', schema);
            });

            after(function(done){
                Model.remove({}, done);
            });


            it('adds #udateTag() setter when using the plugin defaults', function(){
                var schema = new mongoose.Schema({
                    name: String
                });
                schema.plugin(tagPlugin);
                expect(schema.methods).to.have.a.property('updateTag');
                expect(schema.methods.updateTag).to.be.a('function');
            });

            it('adds #update[Custom]() setter when using methodSuffix in the options', function(){
                var schema = new mongoose.Schema({
                    name: String
                });
                schema.plugin(tagPlugin, {methodSuffix: 'Marks'});
                expect(schema.methods).to.have.a.property('updateMarks');
                expect(schema.methods.updateMarks).to.be.a('function');
            });

            it('updates items in the collection', function(){
                var doc = new Model({name:'test'});
                doc.addTag('testTag4');
                doc.addTag('testTag5');
                doc.addTag('testTag6');
                expect(doc.tags).to.be.an('array');
                expect(doc.tags).to.have.length(3);
                expect(doc.tags).to.contain('testTag5');
                expect(doc.updateTag('testTag5', 'newTestTag5')).to.be.true; // successfull update
                expect(doc.updateTag('testTag5', 'newTestTag5')).to.be.false; // cant do it since already done
                expect(doc.tags).to.be.an('array');
                expect(doc.tags).to.have.length(3);
                expect(doc.tags).to.contain('testTag4');
                expect(doc.tags).to.contain('newTestTag5');
                expect(doc.tags).to.contain('testTag6');
            });


            it('updates items in the collection and persists to db when callback is given', function(done){

                var doc;

                async.series([

                    function(done){
                        doc = new Model({name:'test'});
                        doc.addTag('testTag1');
                        doc.addTag('testTag2');
                        doc.addTag('testTag3');
                        doc.save(done);
                    },

                    function(done){
                        expect(doc.tags).to.have.length(3);
                        expect(doc.tags).to.contain('testTag3');
                        doc.updateTag('testTag2', 'testTaggy2', done);
                    },

                    function(done){
                        Model.findById(doc._id, function(err, refresh){
                            expect(refresh).to.exist;
                            doc = refresh;
                            done(err);
                        });
                    },

                    function(done){
                        expect(doc.tags).to.be.an('array');
                        expect(doc.tags).to.have.length(3);
                        expect(doc.tags[0]).to.equal('testTag1');
                        expect(doc.tags[1]).to.equal('testTaggy2');
                        expect(doc.tags[2]).to.equal('testTag3');
                        done();
                    }

                ], done);

            });


            it('returns error.NotFound if tag is not found for easy express handling', function(done){
                doc = new Model({name:'test'});
                doc.removeTag('testTag', function(err){
                    expect(err).to.exist;
                    expect(err).to.have.a.property('name', 'ResourceNotFoundError');
                    expect(err).to.have.a.property('message', 'Resource not found');
                    done();
                });

            });

        });





        describe('validation', function(){

            it('does not add duplicates', function(done){

                var schema = new mongoose.Schema({
                    name: String
                });
                schema.plugin(tagPlugin);
                var Model = mongoose.model('tagPluginNoDuplicates', schema);

                var doc = new Model({name: 'test'});
                doc.addTag('new');
                doc.addTag('new');

                doc.save(function(err, tag) {
                    expect(err).to.exist;
                    expect(err).to.have.a.deep.property('message', 'tagPluginNoDuplicates validation failed');
                    expect(err).to.have.a.deep.property('name', 'ValidationError');
                    expect(err).to.have.a.deep.property('errors.tags.message', 'Duplicate entries not allowed');
                    expect(err).to.have.a.deep.property('errors.tags.kind', 'unique');
                    Model.remove({}, done);
                });
            });

            it('does add duplicates if allowDuplicates is set to true', function(done){

                var schema = new mongoose.Schema({
                    name: String
                });
                schema.plugin(tagPlugin, {allowDuplicates: true});
                var Model = mongoose.model('tagPluginWithDuplicates', schema);

                var doc = new Model({name: 'test'});
                doc.addTag('new');
                doc.addTag('new');

                doc.save(function(err, tag) {
                    expect(err).to.not.exist;
                    Model.remove({}, done);
                });
            });

            it('filters duplicates if filterDuplicates is set to true', function(done){

                var schema = new mongoose.Schema({
                    name: String
                });
                schema.plugin(tagPlugin, {filterDuplicates: true});
                var Model = mongoose.model('tagPluginWithFilterDuplicates', schema);

                var doc = new Model({name: 'test'});
                doc.addTag('A');

                async.series([

                    function(done) {
                        doc.addTag('B', done);
                    },
                    function(done) {
                        doc.addTag('B', done);
                    },
                    function(done) {
                        doc.addTag('C', done);
                    },
                    function(done) {
                        Model.findById(doc._id, function(err, refresh){
                            expect(refresh).to.exist;
                            doc = refresh;
                            done(err);
                        });
                    }
                ], function(err){
                    expect(err).to.not.exist;
                    expect(doc.tags).to.be.an('array');
                    expect(doc.tags).to.have.length(3);
                    expect(doc.tags).to.contain('A');
                    expect(doc.tags).to.contain('B');
                    expect(doc.tags).to.contain('C');
                    Model.remove({}, done);
                });
            });

        });
    });
});
