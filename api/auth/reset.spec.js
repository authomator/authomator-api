'use strict';

var chai = require("chai"),
    sinon = require("sinon"),
    sinonChai = require("sinon-chai"),
    async = require('async'),
    _ = require('lodash'),
    request = require('supertest');

var expect = chai.expect;
chai.use(sinonChai);

/**************************************************************************
 * Begin of tests
 *************************************************************************/

var app = require('../../app');
var User = require('../../lib/models/user/user.model');
var UserMocks = require('../../lib/models/user/user.mocks');
var mail = require('../../lib/mail');
var jwt = require('../../lib/jwt');

describe('api.auth.reset', function() {

    afterEach(function (done) {
        User.remove({}, done);
    });

    /**************************************************************************
      __  __      _ _                   _   
     |  \/  |__ _(_) |  _ _ ___ ___ ___| |_ 
     | |\/| / _` | | | | '_/ -_|_-</ -_)  _|
     |_|  |_\__,_|_|_| |_| \___/__/\___|\__|
     
    ***************************************************************************/                                      
    describe('POST /api/auth/reset/mail', function () {
        
        describe('endpoint validation', function () {

            it('ensures that email and url are proper strings', function (done) {

                request(app)
                    .post('/api/auth/reset/mail')
                    .send({
                        email: {'$or': [{1: 1}]},
                        url: {}
                    })
                    .expect(422)
                    .expect('Content-Type', 'application/json; charset=utf-8')
                    .end(function (err, res) {
                        expect(err).to.not.exist;
                        expect(res.body).to.have.a.property('name', 'ValidationError');
                        expect(res.body).to.have.a.property('message', 'Validation failed');
                        expect(res.body).to.have.a.deep.property('errors.email.kind', 'string.base');
                        expect(res.body).to.have.a.deep.property('errors.url.kind', 'string.base');
                        done()
                    })
            });

            it('ensures that url is an acceptable uri', function (done) {
                request(app)
                    .post('/api/auth/reset/mail')
                    .send({
                        email: 'test@local.com',
                        url: 'www.msn.com'
                    })
                    .expect(422)
                    .expect('Content-Type', 'application/json; charset=utf-8')
                    .end(function (err, res) {
                        expect(err).to.not.exist;
                        expect(res.body).to.have.a.property('name', 'ValidationError');
                        expect(res.body).to.have.a.property('message', 'Validation failed');
                        expect(res.body).to.not.have.a.deep.property('errors.email');
                        expect(res.body).to.have.a.deep.property('errors.url.kind', 'string.uri');
                        done()
                    })
            });
        });
        
        describe('endpoint', function(){

            var user;

            beforeEach(function (done) {
                User.remove({}, done);
            });
            
            beforeEach(function(done){
                user = new User(UserMocks.localDummy1);
                user.save(done);
            });

            it('sends an email with the password reset token', function(done){

                var sendPasswordReset = function(userRecv, resetUrlResv, done){
                    expect(userRecv.identities.local.email).to.equal(user.identities.local.email);
                    expect(resetUrlResv.href).to.equal('https://127.0.0.1/');
                    done();
                };
                
                var mailStub = sinon.stub(mail, "sendPasswordReset", sendPasswordReset);
                
                request(app)
                    .post('/api/auth/reset/mail')
                    .send({
                        email: user.identities.local.email,
                        url: 'https://127.0.0.1'
                    })
                    .expect(204)
                    .end(function (err, res) {
                        expect(err).to.not.exist;
                        expect(mailStub).to.have.been.calledOnce;
                        mail.sendPasswordReset.restore();
                        done()
                    })

            });
            
            
            it('only allows sending email with an url that is in config.mail.resetLinkAllowedDomains', function(done){
                
                request(app)
                    .post('/api/auth/reset/mail')
                    .send({
                        email: user.identities.local.email,
                        url: 'https://127.0.0.2'
                    })
                    .expect(403)
                    .end(function (err, res) {
                        expect(err).to.not.exist;
                        expect(res.body).to.have.a.property('name', 'ForbiddenError');
                        expect(res.body).to.have.a.property('message', 'Unable to set password reset url to unauthorized location');
                        done()
                    })
            });
            
            it('only allows sending email with an url that adheres to config.mail.resetLinkAllowNonSecure', function(done){
                
                request(app)
                    .post('/api/auth/reset/mail')
                    .send({
                        email: user.identities.local.email,
                        url: 'http://127.0.0.1'
                    })
                    .expect(403)
                    .end(function (err, res) {
                        expect(err).to.not.exist;
                        expect(res.body).to.have.a.property('name', 'ForbiddenError');
                        expect(res.body).to.have.a.property('message', 'Unable to set password reset url to non-https location');
                        done()
                    })
            });
        });
    });

    /**************************************************************************
      _____    _                              _   
     |_   _|__| |_____ _ _    _ _ ___ ___ ___| |_ 
       | |/ _ \ / / -_) ' \  | '_/ -_|_-</ -_)  _|
       |_|\___/_\_\___|_||_| |_| \___/__/\___|\__|
     
     ***************************************************************************/
    describe('POST /api/auth/reset/:token', function () {

        describe('endpoint validation', function () {

            it('ensures that password is a proper string', function (done) {

                request(app)
                    .post('/api/auth/reset/sometoken')
                    .send({
                        password: {'$or': [{1: 1}]}
                    })
                    .expect(422)
                    .expect('Content-Type', 'application/json; charset=utf-8')
                    .end(function (err, res) {
                        expect(err).to.not.exist;
                        expect(res.body).to.have.a.property('name', 'ValidationError');
                        expect(res.body).to.have.a.property('message', 'Validation failed');
                        expect(res.body).to.have.a.deep.property('errors.password.kind', 'string.base');
                        done()
                    })
            });
            
        });

        describe('endpoint', function () {
            
            var token, user;

            beforeEach(function (done) {
                User.remove({}, done);
            });

            beforeEach(function(done){
                user = new User(UserMocks.localDummy1);
                user.save(done);
            });

            beforeEach(function(done){
                jwt.createResetToken(user, function(err, tok){
                    token = tok;
                    done(err);
                });
            });
            
            it('should use jwt#verifyResetToken to ensure the token is correct', function(done){
                var jwtStub = sinon.stub(jwt, "verifyResetToken");
                jwtStub.callsArgWith(1, null, {sub: user._id.toString()});
                
                request(app)
                    .post('/api/auth/reset/' + token)
                    .send({
                        password: 'test'
                    })
                    .expect(204)
                    .end(function (err, res) {
                        expect(err).to.not.exist;
                        expect(jwtStub).to.have.been.calledOnce;
                        jwt.verifyResetToken.restore();
                        done()
                    });
            });
            
            it('should send status 400 for invalid tokens', function(done){
                request(app)
                    .post('/api/auth/reset/' + 'e' + token)
                    .send({
                        password: 'test'
                    })
                    .expect(400)
                    .end(function (err, res) {
                        expect(err).to.not.exist;
                        expect(res.body).to.have.a.property('name', 'InvalidTokenError');
                        expect(res.body).to.have.a.property('message', 'Reset password token is not valid');
                        done()
                    });
            });
            
            it('should send status 404 for non-existing users', function(done){
                async.series(
                    [
                        
                        function(done){
                            user.remove(done);
                        },
                        
                        function(done){
                            request(app)
                                .post('/api/auth/reset/' + token)
                                .send({
                                    password: 'test'
                                })
                                .expect(404)
                                .end(function (err, res) {
                                    expect(err).to.not.exist;
                                    expect(res.body).to.have.a.property('name', 'ResourceNotFoundError');
                                    expect(res.body).to.have.a.property('message', 'Resource not found');
                                    done(err)
                                });
                        }
                    ], 
                    done
                );
            });
            
            it('should set a new password if token/password are acceptable', function(done){
                async.series(
                    [
                        function(done) {
                            request(app)
                                .post('/api/auth/reset/' + token)
                                .send({
                                    password: 'testnewpass'
                                })
                                .expect(204)
                                .end(function (err, res) {
                                    expect(err).to.not.exist;
                                    done()
                                });
                        },
                        function(done){
                            User.login(UserMocks.localDummy1.identities.local.email, 'testnewpass', function(err, doc){
                                expect(err).to.not.exist;
                                expect(doc).to.exist;
                                done(err);
                            });
                        }
                    ], 
                    done);
            });
        });
    });
});