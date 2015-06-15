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

describe('api.auth.reset', function() {

    afterEach(function (done) {
        User.remove({}, done);
    });
    
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
                    .expect(201)
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
});