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

describe('api.auth.reset', function() {

    describe('POST /api/auth/reset/mail', function () {

        var user;

        beforeEach(function (done) {
            User.remove({}, done);
        });

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
    });
});