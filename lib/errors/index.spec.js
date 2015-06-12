var chai = require("chai"),
    sinon = require("sinon"),
    sinonChai = require("sinon-chai"),

expect = chai.expect;
chai.use(sinonChai);


/**************************************************************************
 * Begin of tests
 *************************************************************************/


var errors = require('./index.js');

describe('Errors', function(){

    [
        'InvalidCredentialsError',
        'ResourceNotFoundError',
        'UnauthorizedError',
        'FailedDependencyError'
    ]
        .forEach(function(error){

            describe(error, function(){

                it('should be exported', function(){
                    expect(errors).to.have.a.deep.property(error);
                });

                it('should be an object', function(){
                    expect(errors[error]).to.be.a('function');

                    var err = new errors[error]('');
                    expect(err).to.have.a.deep.property('name');
                    expect(err).to.have.a.deep.property('message');
                });

            });
    });


    describe('middleware', function(){
        it('should be exported', function(){
            expect(errors).to.have.a.deep.property('middleware');
        });
    });

});