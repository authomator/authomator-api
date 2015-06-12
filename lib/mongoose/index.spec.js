var chai = require("chai"),
    sinon = require("sinon"),
    sinonChai = require("sinon-chai"),
    async = require('async'),
    _ = require('lodash');

expect = chai.expect;
chai.use(sinonChai);



/**************************************************************************
 * Begin of tests
 *************************************************************************/

var lib = require('./index');

describe('Mongoose', function(){

    describe('Model', function(){

        it('is exported', function(){
            expect(lib).to.have.a.property('Model');
        });

        it('is a function', function(){
            expect(lib.Model).to.be.a('function');
        });

    });

    describe('Schema', function(){

        it('is exported', function(){
            expect(lib).to.have.a.property('Schema');
        });

        it('is a function', function(){
            expect(lib.Schema).to.be.a('function');
        });

        describe('Plugins', function(){

            it('is exported', function(){
                expect(lib.Schema).to.have.a.property('Plugin');
            });
        });
    });


    describe('setup', function(){

        it('is exported', function(){
            expect(lib).to.have.a.property('setup');
        });

        it('is a function', function(){
            expect(lib.setup).to.be.a('function');
        });
    });

});
