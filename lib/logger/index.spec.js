var chai = require("chai"),
    sinon = require("sinon"),
    sinonChai = require("sinon-chai"),

    expect = chai.expect;
    chai.use(sinonChai);


/**************************************************************************
 * Begin of tests
 *************************************************************************/


var logger = require('./index.js');

describe('Logger', function(){

    describe('#()', function() {
        it('should be an object', function(){
            expect(logger).to.be.an.object;
        });
    });

    describe('#log', function() {

        it('should have a log method', function() {
            expect(logger.log).to.be.a('function');
        });
    });

    describe('#debug', function() {

        it('should have a debug method', function() {
            expect(logger.debug).to.be.a('function');
        });
    });

    describe('#info', function() {

        it('should have a info method', function() {
            expect(logger.info).to.be.a('function');
        });
    });

    describe('#warn', function() {

        it('should have a warn method', function() {
            expect(logger.warn).to.be.a('function');
        });
    });

    describe('#error', function() {

        it('should have an error method', function() {
            expect(logger.error).to.be.a('function');
        });
    });

});