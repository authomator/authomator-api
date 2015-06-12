var chai = require("chai"),
    sinon = require("sinon"),
    sinonChai = require("sinon-chai"),
    _ = require('lodash');

expect = chai.expect;
chai.use(sinonChai);


/**************************************************************************
 * Begin of tests
 *************************************************************************/


var jwt = require('./index.js');
var config = require('../../config');
var jsonwebtoken = require('jsonwebtoken');

var app = require('../../app');
var User = require('../models/user/user.model.js');
var userMocks = require('../models/user/user.mocks.js');


describe('jwt', function(){

    var mockUser;
    var token;
    
    
    beforeEach(function(done) {
        User.remove({}, done);

    });
    
    beforeEach(function(done){
        user = new User(userMocks.localDummy1);
        user.save(done);
    });
    
    
    describe('#config()', function(){
        
        it('should be a function', function(){
            expect(jwt.setup).to.be.a('function')
        });
        
        it('should set the config options', function(){
            expect(jwt.__config).to.be.an('object');
            expect(jwt.__config).to.not.contain.keys('test');
            jwt.setup({test: 'joe'});
            expect(jwt.__config).to.have.a.property('test', 'joe');
        });
    });
    
    
    /****************************************************************************************************************
      ___    _         _   _ _          _____    _            
     |_ _|__| |___ _ _| |_(_) |_ _  _  |_   _|__| |_____ _ _  
      | |/ _` / -_) ' \  _| |  _| || |   | |/ _ \ / / -_) ' \ 
     |___\__,_\___|_||_\__|_|\__|\_, |   |_|\___/_\_\___|_||_|
                                 |__/
     ****************************************************************************************************************/
    
    describe('#createIdentityToken()', function() {
        
        var secret = config.jwt.tokenSecret;
        var options = {
            issuer: config.jwt.issuer,
            audience: config.jwt.audience,
            algorithm: config.jwt.algorithm
        };
        
        beforeEach(function(done){
            
            jwt.createIdentityToken(user, function(err, tok){
                token = tok;
                done(err);
            });
        });
        
        it('should be a function', function(){
            
            expect(jwt.createIdentityToken).to.be.a('function');
        });
        
        it('should create a jwt token with the user data by calling toJwt', function(done){
            
            var spy = sinon.spy(user, 'toJwt');
            
            jwt.createIdentityToken(user, function(err, token){
                expect(spy).to.have.been.calledOnce;

                var data = jsonwebtoken.verify(token, secret, options);
                expect(data).to.have.a.deep.property('identities.local.email', user.identities.local.email);
                expect(data).to.have.a.property('sub', user._id.toString());
                
                done(err);
            });
        });
        
        it('should create a jwt token without the user identities.local.secret', function(){
            
            var data = jsonwebtoken.verify(token,secret,options);
            expect(data).to.not.have.a.property('identities.local.secret');
            expect(data).to.have.a.deep.property('identities.local');
            expect(data.identities.local).to.be.an('object');
        });
        
        it('should create a jwt token with the correct issuer', function(){
            
            var data = jsonwebtoken.verify(token,secret,options);
            expect(data).to.have.a.property('iss', options.issuer);
        });
        
        it('should create a jwt token with the correct audience', function(){
            
            var data = jsonwebtoken.verify(token,secret,options);
            expect(data).to.have.a.property('aud', options.audience);
        });
    });
    
    
     /****************************************************************************************************************
            _                     _____    _            
           /_\  __ __ ___ ______ |_   _|__| |_____ _ _  
          / _ \/ _/ _/ -_|_-<_-<   | |/ _ \ / / -_) ' \ 
         /_/ \_\__\__\___/__/__/   |_|\___/_\_\___|_||_|
                                                        
     ****************************************************************************************************************/
     
     describe('#createAccessToken()', function() {

         var secret = config.jwt.tokenSecret;
         var options = {
             issuer: config.jwt.issuer,
             audience: config.jwt.audience,
             algorithm: config.jwt.algorithm
         };

         beforeEach(function(done){

             jwt.createAccessToken(user, function(err, tok){
                 token = tok;
                 done(err);
             });
         });

         it('should be a function', function(){

             expect(jwt.createAccessToken).to.be.a('function');
         });
         
         it('should create a jwt token without the user data', function(){

             var data = jsonwebtoken.verify(token,secret,options);
             expect(data).to.contain.keys('sub', 'iat', 'exp', 'aud', 'iss');
             expect(Object.keys(data)).to.have.length(5);
         });

         it('should create a jwt token with the correct issuer', function(){

             var data = jsonwebtoken.verify(token,secret,options);
             expect(data).to.have.a.property('iss', options.issuer);
         });

         it('should create a jwt token with the correct audience', function(){

             var data = jsonwebtoken.verify(token,secret,options);
             expect(data).to.have.a.property('aud', options.audience);
         });
     });

    /****************************************************************************************************************
          ___      __            _    
         | _ \___ / _|_ _ ___ __| |_  
         |   / -_)  _| '_/ -_|_-< ' \ 
         |_|_\___|_| |_| \___/__/_||_|
      
     ****************************************************************************************************************/
     
    describe('#createRefreshToken()', function() {
    
        var secret = config.jwt.refreshSecret;
        var options = {
            issuer: config.jwt.issuer,
            audience: config.jwt.issuer + '#refresh',
            algorithm: config.jwt.algorithm
        };
    
        beforeEach(function(done){
            
            jwt.createRefreshToken(user, function(err, tok){
                token = tok;
                done(err);
            });
        });
    
    
        it('should be a function', function(){
    
            expect(jwt.createRefreshToken).to.be.a('function');
        });
    
        it('should create a jwt token with the user._id', function(done){
    
            var spy = sinon.spy(user, 'toJwt');
    
            jwt.createRefreshToken(user, function(err, token){
                expect(spy).to.not.have.been.called;
    
                var data = jsonwebtoken.verify(token, secret, options);
                expect(data).to.have.a.property('sub', user._id.toString());
                expect(data).to.not.have.a.property('identities');
    
                done(err);
            });
        });
    
        it('should create a jwt token with only a user._id', function(){
    
            var data = jsonwebtoken.verify(token,secret,options);
            expect(data).to.not.have.a.property('identities');
            expect(_.keys(data)).to.have.length(5);
        });
    
        it('should create a jwt token with the correct issuer', function(){
    
            var data = jsonwebtoken.verify(token,secret,options);
            expect(data).to.have.a.property('iss', options.issuer);
        });
    
        it('should create a jwt token with the correct audience', function(){
    
            var data = jsonwebtoken.verify(token,secret,options);
            expect(data).to.have.a.property('aud', options.audience);
        });
    });


    describe('#verifyRefreshToken()', function(){

        beforeEach(function(done){

            jwt.createRefreshToken(user, function(err, tok){
                token = tok;
                done(err);
            });
        });


        it('should be a function', function(){

            expect(jwt.verifyRefreshToken).to.be.a('function');
        });


        it('should call the passed callback function with the jwt data', function(done){

            jwt.verifyRefreshToken(token, function(err, data){
                expect(err).to.not.exist;
                expect(Object.keys(data)).to.have.a.lengthOf(5);
                expect(data.aud).to.contain('#refresh');
                done();
            });
        });


        it('should not validate a regular token', function(done){

            jwt.createIdentityToken(user, function(err, token) {

                jwt.verifyRefreshToken(token, function (err, data) {
                    expect(err).to.exist;
                    expect(err).to.have.a.property('name', 'JsonWebTokenError');
                    expect(err).to.have.a.property('message', 'invalid signature');
                    done();
                });
            });
        });


        it('should not validate a reset token', function(done){

            jwt.createResetToken(user, function(err, token) {

                jwt.verifyRefreshToken(token, function (err, data) {
                    expect(err).to.exist;
                    expect(err).to.have.a.property('name', 'JsonWebTokenError');
                    expect(err).to.have.a.property('message', 'invalid signature');
                    done();
                });
            });

        });
    });
    
     /****************************************************************************************************************
      ___             _
      | _ \___ ___ ___| |_
      |   / -_|_-</ -_)  _|
      |_|_\___/__/\___|\__|
      
      ****************************************************************************************************************/
     
    describe('#createResetToken()', function() {
        
        var secret = config.jwt.tokenSecret;
        var options = {
            issuer: config.jwt.issuer,
            audience: config.jwt.issuer + '#password-reset',
            algorithm: config.jwt.algorithm
        };
        
        beforeEach(function(done){
            
            jwt.createResetToken(user, function(err, tok){
                token = tok;
                done(err);
            });
        });
    
    
        it('should be a function', function(){
    
            expect(jwt.createResetToken).to.be.a('function');
        });
    
        it('should create a jwt token with the user._id', function(done){
    
            var spy = sinon.spy(user, 'toJwt');
    
            jwt.createResetToken(user, function(err, token){
                expect(spy).to.not.have.been.called;
    
                var data = jsonwebtoken.verify(token, secret, options);
                expect(data).to.have.a.property('sub', user._id.toString());
                done(err);
            });
        });
    
        it('should create a jwt token with only a user id', function(){
            
            var data = jsonwebtoken.verify(token,secret,options);
            expect(data).to.not.have.a.property('_auth');
            expect(data).to.not.have.a.property('firstName');
            expect(_.keys(data)).to.have.length(5);
        });
    
        it('should create a jwt token with the correct issuer', function(){
            
            var data = jsonwebtoken.verify(token,secret,options);
            expect(data).to.have.a.property('iss', options.issuer);
        });
    
        it('should create a jwt token with the correct audience', function(){
            
            var data = jsonwebtoken.verify(token,secret,options);
            expect(data).to.have.a.property('aud', options.audience);
        });
    
        it('should create a jwt token with the expire set to reset.expiresInMinutes', function(){
            
            var data = jsonwebtoken.verify(token,secret,options);
            expect(data.exp).to.be.closeTo(((new Date).getTime()/1000) + config.jwt.resetExpiresInMinutes * 60, 1);
        });
    });

    
    describe('#verifyResetToken()', function(){

        beforeEach(function(done){

            jwt.createResetToken(user, function(err, tok){
                token = tok;
                done(err);
            });
        });


        it('should be a function', function(){

            expect(jwt.verifyResetToken).to.be.a('function');
        });


        it('should call the passed callback function with the jwt data', function(done){

            jwt.verifyResetToken(token, function(err, data){
                expect(err).to.not.exist;
                expect(Object.keys(data)).to.have.a.lengthOf(5);
                expect(data.aud).to.contain('#password-reset');
                done();
            });
        });


        it('should not validate a regular token', function(done){

            jwt.createIdentityToken(user, function(err, token) {

                jwt.verifyResetToken(token, function (err, data) {
                    expect(err).to.exist;
                    expect(err).to.have.a.property('name', 'JsonWebTokenError');
                    expect(err).to.have.a.property('message', 'jwt audience invalid. expected: authomator#password-reset');
                    done();
                });
            });
        });


        it('should not validate a refresh token', function(done){

            jwt.createRefreshToken(user, function(err, token) {

                jwt.verifyResetToken(token, function (err, data) {
                    expect(err).to.exist;
                    expect(err).to.have.a.property('name', 'JsonWebTokenError');
                    expect(err).to.have.a.property('message', 'invalid signature');
                    done();
                });
            });

        });
    });
    
    
     /****************************************************************************************************************
                          _      _____    _               
          __ _ _ ___ __ _| |_ __|_   _|__| |_____ _ _  ___
         / _| '_/ -_) _` |  _/ -_)| |/ _ \ / / -_) ' \(_-<
         \__|_| \___\__,_|\__\___||_|\___/_\_\___|_||_/__/
                                                  
     ****************************************************************************************************************/
     
    describe('#createTokens()', function() {
        
        it('should be a function', function(){
    
            expect(jwt.createTokens).to.be.a('function');
        });
    
        it('should create the identity, access and refresh jwt tokens', function(done){
            
            jwt.createTokens(user, function(err, iToken, aToken, rToken){
                
                expect(err).to.not.exist;
                
                iData = jsonwebtoken.verify(iToken, config.jwt.tokenSecret, {
                    issuer: config.jwt.issuer,
                    audience: config.jwt.audience,
                    algorithm: config.jwt.algorithm
                });
                
                aData = jsonwebtoken.verify(aToken, config.jwt.tokenSecret, {
                    issuer: config.jwt.issuer,
                    audience: config.jwt.audience,
                    algorithm: config.jwt.algorithm
                });
                
                rData = jsonwebtoken.verify(rToken, config.jwt.refreshSecret, {
                    issuer: config.jwt.issuer,
                    audience: config.jwt.issuer + '#refresh',
                    algorithm: config.jwt.algorithm
                });
                
                expect(Object.keys(iData)).to.have.a.lengthOf(6);
                expect(Object.keys(aData)).to.have.a.lengthOf(5);
                expect(Object.keys(rData)).to.have.a.lengthOf(5);
                
                done(err)
            });
    
        });
    });
});