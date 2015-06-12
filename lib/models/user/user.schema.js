'use strict';

var mongoose = require('../../mongoose'),
    validate = require('mongoose-validator'),
    errors = require('../../errors'),
    bcrypt = require('bcrypt'),
    crypto = require('crypto'),
    jwt = require('../../jwt'),
    SALT_WORK_FACTOR = 10;


var User = new mongoose.Schema(
    {
        identities : {
            
            local : {
                
                email: {
                    type: String, 
                    lowercase: true, 
                    unique: true,
                    sparse: true,
                    validate: [
                        validate({
                            validator: 'isEmail',
                            passIfEmpty: true
                        })
                    ]
                },
                
                secret: { 
                    type: String
                }
            },
            
            google : {
                
                id: {
                    type: String, 
                    unique: true,
                    sparse: true
                },
                
                data : {
                    // all data received from google
                },
                
                refresh: {
                    type: String
                }
            }
        }
    },
    {
        toJSON    : { 
            hide: 'identities.local.secret identities.google.refresh',
            getters: true
        }
    }
);

/**************************************************************************
 * Schema methods
 *************************************************************************/
User.methods.toJwt = function () {
    
    var jwtData = this.toJSON();
    jwtData.sub = jwtData._id.toString();
    delete jwtData.createdAt;
    delete jwtData.updatedAt;
    delete jwtData.__v;
    delete jwtData._id;
    delete jwtData.id;
    if (!jwtData.identities) jwtData.identities = {};
    return jwtData;
};


/**************************************************************************
 * Schema statics
 *************************************************************************/

/**
 * Perform local authentication
 *
 * @param {string} email - Email of the user (case insensitive)
 * @param {string} password - Cleartext password
 * @param {function} cb - Callback funtion receives (err, User|false, errInfo)
 * @returns {*}
 */
User.statics.login = function (email, password, cb) {

    // Lowercase the email
    if (typeof email !== 'string') return cb(new errors.InvalidCredentialsError());
    email = email.toLowerCase().trim();
    
    // Make sure the password is a string
    if (typeof password !== 'string') return cb(new errors.InvalidCredentialsError());
    
    // Reject empty passwords
    if (password.length == 0) return cb(new errors.InvalidCredentialsError());

    
    this.findOne({'identities.local.email': email}, function (error, doc) {

            if (error) return cb(error);
    
            if (!doc) {
                return cb(new errors.InvalidCredentialsError());
            }
            
            if (!doc.identities.local.secret) {
                return cb(new errors.InvalidCredentialsError());
            }
            
            bcrypt.compare(password, doc.identities.local.secret, function(err, isMatch) {
    
                if (err) return cb(err);
    
                if (isMatch) return cb(null, doc);
    
                cb(new errors.InvalidCredentialsError());
            });

    });
};


User.statics.signup = function(email, password, cb) {
    
    var user = new this();
    user.identities.local.email = email;
    user.identities.local.secret = password;
    user.save(cb);
    
};


/**************************************************************************
 * Pre-* hooks
 *************************************************************************/

/**
 * Pre-save middleware to pull out the plaintext password and hash it..
 * since this needs to run async we cannot use a regular setter
 */
User.pre('save', true, function (next, done) {

    next(); // kickoff next parallel middleware
    
    var self = this;

    // only hash the password if it has been modified/new
    if (! self.isModified('identities.local.secret') ) return done();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {

        if (err) return done(err);

        // create new password hash using the previously created salt
        bcrypt.hash(self.identities.local.secret, salt, function(err, hash) {

            if (err) return done(err);

            // override the cleartext password with the hashed one
            self.identities.local.secret = hash;

            done();
        });
    });
});



/**
 * Pre-save middleware to check if the email has not been registered yet as a
 * local identity and turn it into a ValidationError instead of the E11000
 * Integrity error
 */
User.pre('validate', true, function (next, done) {

    next(); // kickoff next parallel middleware

    var self = this;

    // If no local identity exists, just move on..
    if (! self.identities.local.email ) return done();
    
    this.constructor.findOne({"identities.local.email": self.identities.local.email}, function(err, doc) {

        if (err) return done(err);

        if (doc) {

            if(self._id.toString() === doc._id.toString()) return done();

            self.invalidate('identities.local.email',
                new mongoose.Error.ValidatorError({
                    path: 'identities.local.email', 
                    message: 'The specified email address is already in use.', 
                    type: 'unique', // Mongoose bug.. should be kind: 'unique'
                    value: self.identities.local.email
                })
            );
        }
        done();
    });
});



/**
 * Pre-validate middleware to check if the email has been set, if so a non-empty password
 * needs to be set as well..
 */
User.pre('validate', true, function (next, done) {

    next(); // kickoff next parallel middleware

    var self = this;

    // If no local identity exists, just move on..
    if (! self.identities.local.email) return done();
    
    if (! self.identities.local.secret || self.identities.local.secret == '') {
        self.invalidate('identities.local.secret',
            new mongoose.Error.ValidatorError({
                path: 'identities.local.secret',
                message: 'The specified password is invalid.',
                type: 'Invalid Password',
                value: ''
            })
        );
    }
    
    done();
    
});



module.exports = exports = mongoose.Model('User', User);
