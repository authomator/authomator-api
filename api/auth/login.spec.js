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
var jwt = require('../../lib/jwt');
var jsonwebtoken = require('jsonwebtoken');
var config = require('../../config');

describe('api.auth.login', function() {
    
    describe('POST /api/auth/login', function () {

        var user;

        beforeEach(function (done) {
            User.remove({}, done);
        });

        beforeEach(function (done) {
            user = new User(UserMocks.localDummy1);
            user.save(done);
        });

        it('should return a new identity, access and refresh token for a valid login', function (done) {

            request(app)
                .post('/api/auth/login')
                .send({
                    email: UserMocks.localDummy1.identities.local.email,
                    password: UserMocks.localDummy1.identities.local.secret
                })
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end(function (err, res) {

                    expect(err).to.not.exist;
                    expect(Object.keys(res.body)).to.have.length(3);
                    expect(res.body).to.contain.keys('it', 'at', 'rt');

                    async.series([

                        function (done) {

                            var data = jsonwebtoken.verify(res.body.it, config.jwt.tokenSecret, {
                                issuer: config.jwt.issuer,
                                audience: config.jwt.audience,
                                algorithm: config.jwt.algorithm
                            });
                            expect(data).to.contain.keys('sub', 'iat', 'exp', 'iss', 'aud', 'identities');
                            expect(Object.keys(data)).to.have.length(6);
                            done();
                        },

                        function (done) {

                            var data = jsonwebtoken.verify(res.body.at, config.jwt.tokenSecret, {
                                issuer: config.jwt.issuer,
                                audience: config.jwt.audience,
                                algorithm: config.jwt.algorithm
                            });

                            expect(data).to.contain.keys('sub', 'iat', 'exp', 'iss', 'aud');
                            expect(Object.keys(data)).to.have.length(5);
                            done();
                        },

                        function (done) {
                            jwt.verifyRefreshToken(res.body.rt, function (err, data) {
                                expect(err).to.not.exist;
                                expect(data).to.contain.keys('sub', 'iat', 'exp', 'iss', 'aud');
                                done(err);
                            });
                        }
                    ], done);
                });
        });


        it('should send 401 when invalid credentials are sent', function (done) {

            request(app)
                .post('/api/auth/login')
                .send({
                    email: UserMocks.localDummy1.identities.local.email,
                    password: 'wrongpassword'
                })
                .expect(401)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end(function (err, res) {
                    expect(err).to.not.exist;
                    expect(res.body).to.have.a.property('name', 'InvalidCredentialsError');
                    expect(res.body).to.have.a.property('message', 'Invalid credentials');
                    done()
                })

        });

        it('should handle weird requests', function (done) {

            request(app)
                .post('/api/auth/login')
                .send({
                    email: {'$or': [{1: 1}]},
                    password: {}
                })
                .expect(422)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end(function (err, res) {
                    expect(err).to.not.exist;
                    expect(res.body).to.have.a.property('name', 'ValidationError');
                    expect(res.body).to.have.a.property('message', 'Validation failed');
                    expect(res.body).to.have.a.deep.property('errors.email.kind', 'string.base');
                    expect(res.body).to.have.a.deep.property('errors.password.kind', 'string.base');
                    done()
                })

        });

    });
});