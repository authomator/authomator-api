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

var app = require('../app');
var User = require('../lib/models/user/user.model');
var UserMocks = require('../lib/models/user/user.mocks');
var jwt = require('../lib/jwt');
var jsonwebtoken = require('jsonwebtoken');
var config = require('../config');

describe('api.refresh', function() {

    before(function(done){
        User.remove({}, done);
    });
    
    describe('POST /api/refresh/:token', function () {
        
        var user, identity, access, refresh;

        beforeEach(function(done){
            User.remove({}, done);
        });
        
        beforeEach(function(done){
            user = new User(UserMocks.localDummy1);
            user.save(done);
        });
        
        beforeEach(function(done){
            jwt.createTokens(user, function(err, it, at, rt){
                identity = it;
                access = at;
                refresh = rt;
                done(err);
            })
        });
        
        it('should refuse garbage refresh tokens', function(done){
            
            request(app)
                .post('/api/refresh/garba.ge_token')
                .expect(400)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end(function(err, res){
                    expect(err).to.not.exist;
                    expect(res.body).to.have.a.property('message', 'Invalid refresh token');
                    done(err);
                });
        });

        it('should refuse invalid refresh tokens', function(done){

            var invalid = jsonwebtoken.sign({sub: '1234567890'}, 'test');
            
            request(app)
                .post('/api/refresh/' + invalid)
                .expect(400)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end(function(err, res){
                    expect(err).to.not.exist;
                    expect(res.body).to.have.a.property('message', 'Invalid refresh token');
                    done(err);
                });
        });

        
        it('should refuse valid tokens (only refresh are allowed)', function(done){
            
            request(app)
                .post('/api/refresh/' + identity)
                .expect(400)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end(function(err, res){
                    expect(err).to.not.exist;
                    expect(res.body).to.have.a.property('message', 'Invalid refresh token');
                    done(err);
                });
        });


        it('should refuse valid tokens (only refresh are allowed)', function(done){

            request(app)
                .post('/api/refresh/' + access)
                .expect(400)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end(function(err, res){
                    expect(err).to.not.exist;
                    expect(res.body).to.have.a.property('message', 'Invalid refresh token');
                    done(err);
                });
        });
        
        
        it('should refuse valid tokens for invalid users', function(done){
            async.series([
                
                function(done){
                    user.remove(done);
                },
                
                function(done){
                    
                    request(app)
                        .post('/api/refresh/' + refresh)
                        .expect(400)
                        .expect('Content-Type', 'application/json; charset=utf-8')
                        .end(function(err, res){
                            expect(err).to.not.exist;
                            expect(res.body).to.have.a.property('message', 'Invalid user refresh token');
                            done(err);
                        });
                }
            ], done);
        });
        
        it('should return a new identity, access and refresh token for a valid request', function(done){
            
            request(app)
                .post('/api/refresh/' + refresh)
                .expect(200)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end(function(err, res){
                    expect(err).to.not.exist;
                    expect(Object.keys(res.body)).to.have.length(3);
                    expect(res.body).to.contain.keys('it', 'at', 'rt');
                    
                    async.series([
                        
                        function(done){

                            var data = jsonwebtoken.verify(res.body.it, config.jwt.tokenSecret, {
                                issuer: config.jwt.issuer,
                                audience: config.jwt.audience,
                                algorithm: config.jwt.algorithm
                            });
                            expect(data).to.contain.keys('sub', 'iat', 'exp', 'iss', 'aud', 'identities');
                            expect(Object.keys(data)).to.have.length(6);
                            done();
                        },

                        function(done){

                            var data = jsonwebtoken.verify(res.body.at, config.jwt.tokenSecret, {
                                issuer: config.jwt.issuer,
                                audience: config.jwt.audience,
                                algorithm: config.jwt.algorithm
                            });

                            expect(data).to.contain.keys('sub', 'iat', 'exp', 'iss', 'aud');
                            expect(Object.keys(data)).to.have.length(5);
                            done();
                        },
                        
                        function(done){
                            jwt.verifyRefreshToken(res.body.rt, function(err, data){
                                expect(err).to.not.exist;
                                expect(data).to.contain.keys('sub', 'iat', 'exp', 'iss', 'aud');
                                done(err);
                            });
                        }
                    ], done);
                });
        });
    });
});