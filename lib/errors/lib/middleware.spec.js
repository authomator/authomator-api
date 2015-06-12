var chai = require("chai"),
    sinon = require("sinon"),
    sinonChai = require("sinon-chai"),
    expect = chai.expect;

chai.use(sinonChai);


/**************************************************************************
 * Begin of tests
 *************************************************************************/

var app = require('../../../app'); // ensures correct environment is loaded
var mongoose = require('mongoose');
var middlewareFactory = require('./middleware.js');
var express = require('express');
//var bodyParser = require('body-parser');
var request = require('supertest');
var InvalidCredentialsError = require('./invalidCredentialsError');
var UnauthorizedError = require('./unauthorizedError');
var ForbiddenError = require('./forbiddenError');
var ResourceNotFoundError = require('./resourceNotFoundError');
var FailedDependencyError = require('./failedDependencyError');
var _ = require('lodash');


describe('express-middleware', function(){

    describe('error-handling', function() {

        var app;
        var middleware;

        beforeEach(function(){
            app = express();
            middleware = middlewareFactory();
        });

        it('should be a function', function(){
            expect(middlewareFactory).to.be.a('function');
        });

        it('should return a function', function(){
            expect(middlewareFactory()).to.be.a('function');
        });

        it('should handle InvalidCredentialsError and return proper responses', function(done){

            app.use(function(req, res, next){
                return next(new InvalidCredentialsError());
            });
            app.use(middleware);

            request(app)
                .get('/')
                .expect(401)
                .expect('Content-Type', /json/)
                .end(function(err, res){
                    expect(_.keys(res.body)).to.have.length(2); // Make sure noting unexpected leaks
                    expect(res.body).to.have.a.property('message', "Invalid credentials");
                    expect(res.body).to.have.a.property('name', "InvalidCredentialsError");
                    done();
                });


        });


        it('should handle Unauthorized and return proper responses', function(done){

            app.use(function(req, res, next){
                return next(new UnauthorizedError());
            });
            app.use(middleware);

            request(app)
                .get('/')
                .expect(401)
                .expect('Content-Type', /json/)
                .end(function(err, res){
                    expect(_.keys(res.body)).to.have.length(2); // Make sure noting unexpected leaks
                    expect(res.body).to.have.a.property('message', "Not authorized");
                    expect(res.body).to.have.a.property('name', "UnauthorizedError");
                    done();
                });
        });
        
        it('should handle ForbiddenError and return a properly formatted error response', function(done){
            
            app.use(function(req, res, next){
                return next(new ForbiddenError('Not allowed'));
            });
            app.use(middleware);
            
            request(app)
                .get('/')
                .expect(403)
                .expect('Content-Type', /json/)
                .end(function(err, res){
                    expect(_.keys(res.body)).to.have.length(2);
                    expect(res.body).to.have.a.property('message', "Not allowed");
                    expect(res.body).to.have.a.property('name', "ForbiddenError");
                    done();
                });
        });

        it('should handle ResourceNotFoundError and return proper responses', function(done){

            app.use(function(req, res, next){
                return next(new ResourceNotFoundError());
            });
            app.use(middleware);

            request(app)
                .get('/')
                .expect(404)
                .expect('Content-Type', /json/)
                .end(function(err, res){
                    expect(_.keys(res.body)).to.have.length(4); // Make sure noting unexpected leaks
                    expect(res.body).to.have.a.property('message', "Resource not found");
                    expect(res.body).to.have.a.property('name', "ResourceNotFoundError");
                    expect(res.body).to.have.a.property('model');
                    expect(res.body).to.have.a.property('id');
                    done();
                });
        });


        it('should handle mongoose ValidationError and return proper responses', function(done){

            app.use(function(req, res, next){

                next(new mongoose.Error.ValidationError({errors: {name: 'required'}, stefan: 'lapers'}));

            });
            app.use(middleware);

            request(app)
                .get('/')
                .expect(422)
                .expect('Content-Type', /json/)
                .end(function(err, res){
                    console.log(res.body);
                    expect(_.keys(res.body)).to.have.length(3); // Make sure noting unexpected leaks
                    expect(res.body).to.have.a.property('message', "Validation failed");
                    expect(res.body).to.have.a.property('name', "ValidationError");
                    expect(res.body).to.have.a.deep.property('errors');
                    done();
                });

        });



        it('should handle mongoose CastError and return a ValidationError responses', function(done){

            app.use(function(req, res, next){
                return next(new mongoose.Error.CastError('ObjectId', 'uncastableid', 'organization'));
            });
            app.use(middleware);

            request(app)
                .get('/')
                .expect(422)
                .expect('Content-Type', /json/)
                .end(function(err, res){
                    console.log(res.body);
                    expect(_.keys(res.body)).to.have.length(3); // Make sure noting unexpected leaks
                    expect(res.body).to.have.a.property('message', "Validation failed");
                    expect(res.body).to.have.a.property('name', "ValidationError");
                    expect(res.body).to.have.a.deep.property('errors.organization.message', 'Cast to ObjectId failed for value "uncastableid" at path "organization"');
                    expect(res.body).to.have.a.deep.property('errors.organization.name', 'CastError');
                    expect(res.body).to.have.a.deep.property('errors.organization.kind', 'ObjectId');
                    expect(res.body).to.have.a.deep.property('errors.organization.value', 'uncastableid');
                    expect(res.body).to.have.a.deep.property('errors.organization.path', 'organization');
                    done();
                });
        });



        it('should handle FailedDependencyError and prevent any other information leaks', function(done){

            app.use(function(req, res, next){
                return next(new FailedDependencyError('Reason why it failed'));
            });
            app.use(middleware);

            request(app)
                .get('/')
                .expect(424)
                .expect('Content-Type', /json/)
                .end(function(err, res){
                    expect(_.keys(res.body)).to.have.length(2); // Make sure noting unexpected leaks
                    expect(res.body).to.have.a.property('message', "Reason why it failed");
                    expect(res.body).to.have.a.property('name', "FailedDependencyError");
                    done();
                });


        });

        it('should handle ValidationError and return a properly formatted error response');

        it('should handle unexpected or non-predefined errors without leaking information', function(done){

            app.use(function(req, res, next){
                return next(new Error('Some unknown/random error'));
            });
            app.use(middleware);

            request(app)
                .get('/')
                .expect(500)
                .expect('Content-Type', /json/)
                .end(function(err, res){
                    expect(res.body).to.have.a.property('message', "An error occured while processing the request");
                    expect(res.body).to.have.a.property('name', "UnexpectedError");
                    done();
                });


        });
    });
});