var chai = require("chai"),
    sinon = require("sinon"),
    sinonChai = require("sinon-chai"),

    expect = chai.expect;
chai.use(sinonChai);


/**************************************************************************
 * Begin of tests
 *************************************************************************/
var m = require('./index.js');
var jwt = require('../jwt');
var config = require('../../config');
var url = require('url');
jwt.setup(config.jwt);


describe('Mail', function(){

    describe('#setup()', function() {
        
        afterEach(function(){
            m.__config = {}; 
        });
        
        it('should be a function', function(){
            expect(m.setup).to.be.a('function')
        });
        
        it('should set the config', function(){
            m.setup({test:'me'});
            expect(m.__config).to.have.a.property('test', 'me');
        });
        
        it('should merge keys to the config', function(){
            m.setup({test:'me'});
            m.setup({test1:'me1'});
            expect(Object.keys(m.__config)).to.have.length(2);
            expect(m.__config).to.have.a.property('test1', 'me1');
            m.setup({test1:'me2'});
            expect(m.__config).to.have.a.property('test1', 'me2');
        });
    });
    
    describe('#transport()', function() {
        
        afterEach(function(){
            m.__config = {};
        });
        
        it('should be a function', function(){
            expect(m.transport).to.be.a('function')
        });
        
        it('returns a nodemailer transport', function(){
            expect(m.transport()).to.be.an('object');
            expect(m.transport().__proto__).to.include.keys('use', 'close', 'sendMail'); // if it walks and quacks ...
        });
    });

    describe('#sendPasswordReset()', function(){
        
        beforeEach(function(){
            m.setup(config.mail);
            m.setup({siteUrl: config.server.url});
        });
        
        it('should be a function', function(){
            expect(m.sendPasswordReset).to.be.a('function');
        });
        
        it('should send a reset password email', function(done){
            
            // Dummy user
            var user = {
                _id: "5575a96317393fec63ea509e",
                sub: "5575a96317393fec63ea509e",
                identities: {
                    local: {
                        email: 'test@local.local'
                    }
                },
                toJwt: function(){return user}
            };
            
            // Create stub transport
            //
            var transport = {
                sendMail: function(args, cb){
                    expect(args).to.include.keys('from', 'to', 'subject', 'html', 'text');
                    expect(args).to.have.a.property('from', config.mail.from);
                    expect(args).to.have.a.property('to', user.identities.local.email);
                    expect(args.html).to.contain('<a href="https://127.0.0.1/test?reset=');
                    expect(args.text).to.contain('https://127.0.0.1/test?reset=');
                    expect(args.subject).to.contain('Password reset');
                    cb();
                }
            };
            
            // Plug in the stub transport
            var transportStub = sinon.stub(m, 'transport', function(){
                return transport;
            });
            
            m.sendPasswordReset(user, url.parse('https://127.0.0.1/test', true), function(err){
                expect(err).to.not.exist;
                expect(transportStub).to.have.been.calledOnce;
                done();
            })
            
        });
    });

});