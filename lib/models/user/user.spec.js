'use strict';

var chai = require("chai"),
    sinon = require("sinon"),
    sinonChai = require("sinon-chai"),
    async = require('async'),
    _ = require('lodash');

var expect = chai.expect;
chai.use(sinonChai);

/**************************************************************************
 * Begin of tests
 *************************************************************************/

var app = require('../../../app');
var User = require('./user.model.js');
var mocks = require('./user.mocks.js');


describe('Models.User', function() {

    var user;

    beforeEach(function(done){
        User.remove({}, done);
    });

    it('should begin with no users', function(done) {
        User.find({}, function(err, users) {
            expect(err).to.not.exist;
            expect(users).to.have.length(0);
            done();
        });
    });

    
    describe('local identities', function() {

        beforeEach(function () {
            user = new User(mocks.localDummy1);
        });

        it('should create user with all properties', function (done) {
            user.save(function (err, doc) {
                expect(err).to.not.exist;
                expect(_.keys(user.__proto__)).to.have.length(12);
                done();
            });
        });

        it('should create user with an encrypted password', function (done) {
            user.save(function (error) {
                expect(error).to.not.exist;
                expect(user).to.have.a.deep.property('identities.local.secret');
                expect(user.identities.local.secret).to.not.equal(mocks.localDummy1.identities.local.secret);
                return done();
            });
        });
        
        it('should prevent the creation of users with an invalid email address', function(done){
            user.identities.local.email = 'notvalid@@emmmail@.be';
            user.save(function (error) {
                expect(error).to.exist;
                expect(error).to.have.a.deep.property('name', 'ValidationError');
                expect(error).to.have.a.deep.property('message', 'User validation failed');
                expect(error).to.have.a.deep.property('errors');
                expect(error.errors['identities.local.email']).to.have.a.deep.property('message', 'Invalid email');
                return done();
            });
        });

        it('should prevent creation of users with a duplicate email', function (done) {
            var user2 = new User(_.cloneDeep(mocks.localDummy1));
            user.save(function (error) {
                expect(error).to.not.exist;
                user2.save(function (err) {
                    expect(err.message).to.equal('User validation failed');
                    expect(err.name).to.equal('ValidationError');
                    expect(err.errors['identities.local.email']).to.have.a.deep.property('message', 'The specified email address is already in use.');
                    expect(err.errors['identities.local.email']).to.have.a.deep.property('kind', 'unique');
                    done();
                });
            });
        });

        it('should allow creation of multiple users without a local identity', function (done) {
            var user2 = new User(_.cloneDeep(mocks.localDummy1));
            delete user.identities.local.email;
            delete user2.identities.local.email;
            user.save(function (error) {
                expect(error).to.not.exist;
                user2.save(function (err) {
                    expect(error).to.not.exist;
                    done();
                });
            });
        });
        
        
        it('should prevent the creation of users without a password', function(done){
            delete user.identities.local.secret;
            user.save(function (error) {
                expect(error).to.exist;
                expect(error).to.have.a.deep.property('name', 'ValidationError');
                expect(error).to.have.a.deep.property('message', 'User validation failed');
                expect(error).to.have.a.deep.property('errors');
                expect(error.errors['identities.local.secret']).to.have.a.deep.property('message', 'The specified password is invalid.');
                return done();
            });
        });

        it('should lowercase an email address', function (done) {
            user.identities.local.id = "test@TeSt.Com";
            user.save(function (err) {
                expect(err).to.not.exist;
                expect(user.email).to.equal(mocks.localDummy1.email);
                return done();
            });
        });

        it('should not send the password and provider property when toJSON is called', function (done) {
            user.save(function (error) {
                expect(error).to.not.exist;
                expect(user.toJSON()).to.not.have.a.deep.property('identities.local.secret');
                expect(user.toJSON()).to.have.a.deep.property('identities.local.email');
                return done();
            });
        });

        it('should allow creation of users without a local identity', function (done) {
            var user2 = _.cloneDeep(mocks.localDummy1);
            delete user2.identities.local;
            var doc = new User(user2);
            doc.save(function (error) {
                expect(error).to.not.exist;
                expect(doc.identities.local.secret).to.not.exist;
                return done();
            });
        });

    });
        
    describe('#login()', function() {

        beforeEach(function () {
            user = new User(mocks.localDummy1);
        });
        
        it('should authenticate users with correct credentials', function (done) {
            user.save(function (error) {
                expect(error).to.not.exist;
                User.login(mocks.localDummy1.identities.local.email,
                            mocks.localDummy1.identities.local.secret, function (err, doc) {
                    expect(err).to.not.exist;
                    expect(doc).to.be.an.object;
                    expect(doc).to.have.a.deep.property('identities.local.email', 
                        mocks.localDummy1.identities.local.email);
                    done();
                });
            });
        });
        
        it('should authenticate users with correct credentials using case insensitive email matching', function (done) {
            user.save(function (error) {
                expect(error).to.not.exist;
                User.login("TeSt@TesT.COM", mocks.localDummy1.identities.local.secret, function (err, doc) {
                    expect(err).to.not.exist;
                    expect(doc).to.be.an.object;
                    expect(doc).to.have.a.deep.property('identities.local.email',
                        mocks.localDummy1.identities.local.email);
                    done();
                });
            });
        });
        
        it('should not authenticate users using empty password', function(done) {
            user.save(function(error){
                expect(error).to.not.exist;
                User.login(mocks.localDummy1.identities.local.email, '', function(err, doc){
                    expect(err).to.exist;
                    expect(doc).to.not.exist;
                    expect(err.name).to.equal('InvalidCredentialsError');
                    expect(err.message).to.equal('Invalid credentials');
                    done();
                });
            });
        });

        it('should not allow local login of account without local identity', function(done){
            var user2 = _.cloneDeep(mocks.localDummy1);
            delete user2.identities.local;
            var doc = new User(user2);

            doc.save(function(error) {
                expect(error).to.not.exist;

                User.login('', 'whatever', function(err, doc){
                    expect(err).to.exist;
                    expect(err.name).to.equal('InvalidCredentialsError');
                    expect(err.message).to.equal('Invalid credentials');
                    done();
                });
            });
        });

        it('should not authenticate users using incorrect password', function(done) {
            user.save(function(error){
                expect(error).to.not.exist;
                User.login(mocks.localDummy1.identities.local.email, 'somewrongpassword', function(err, doc){
                    expect(err).to.exist;
                    expect(doc).to.not.exist;
                    expect(err.name).to.equal('InvalidCredentialsError');
                    expect(err.message).to.equal('Invalid credentials');
                    done();
                });
            });
        });
        
        
        it('should not indicate nonexistence of a user', function(done) {
            User.login(mocks.localDummy1.identities.local.email,
                mocks.localDummy1.identities.local.secret, function(err, doc) {
                expect(err).to.exist;
                expect(doc).to.not.exist;
                expect(err.name).to.equal('InvalidCredentialsError');
                expect(err.message).to.equal('Invalid credentials');
                done();
            });
        });
    });
    
    
    describe('#toJwt', function(){
        
        beforeEach(function () {
            user = new User(mocks.localDummy1);
        });
        
        it('returns the jwt data', function(done){
            user.save(function(err){
                expect(err).to.not.exist;
                expect(_.keys(user.toJwt())).to.have.length(2);
                expect(user.toJwt()).to.have.a.property('sub', user._id.toString());
                expect(user.toJwt()).to.have.a.property('identities');
                expect(user.toJwt()).to.not.have.a.deep.property('identities.local.secret');
                expect(user.toJwt()).to.not.have.a.deep.property('__v');
                expect(user.toJwt()).to.not.have.a.deep.property('_id');
                expect(user.toJwt()).to.not.have.a.deep.property('id');
                expect(user.toJwt()).to.not.have.a.deep.property('createdAt');
                expect(user.toJwt()).to.not.have.a.deep.property('updatedAt');
                done();
            })
        });
        
        it('ensures that the identities key is always present', function(done){
            
            // Since identity.local.secret is excluded from selects, using a query will
            // return a user without identity if no other identities other than
            // local exist. toJwt needs to create the .identities empty object at
            // that point
            
            async.series([
                
                function (done){
                    user.save(done);
                },
                
                function (done){
                    User.findOne({'identities.local.email': mocks.localDummy1.identities.local.email}, function(err, doc){
                        expect(err).to.not.exist;
                        expect(doc).to.exist;
                        expect(doc.toJwt()).to.contain.key('identities')
                        expect(doc.toJwt()).to.not.have.a.deep.property('identities.local.secret');
                        expect(doc.toJwt()).to.have.a.deep.property('identities.local.email');
                        done(err);
                    })
                }
            ], done);
        });
    });
});