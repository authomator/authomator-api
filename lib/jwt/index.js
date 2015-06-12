var jsonwebtoken = require('jsonwebtoken'),
    _ = require('lodash'),
    async = require('async');


/**
 * Export for testability
 * 
 * @type {Object}
 * @private
 */
module.exports.__config = {};


/**
 * Configure the jwt utility functions
 * 
 * @param opts
 */
module.exports.setup = function(opts) {
    _.merge(module.exports.__config, opts);
};


/**
 * Create the identity jwt token
 * @param {mongoose.Document} user - The mongoose user document to create the token for
 * @param {function} callback - Callback function is called with (error, token) when the token is created
 */
module.exports.createIdentityToken = function(user, callback) {

    return process.nextTick(function(){
        callback(
            null,
            jsonwebtoken.sign(
                user.toJwt(),
                module.exports.__config.tokenSecret,
                {
                    audience: module.exports.__config.audience,
                    issuer: module.exports.__config.issuer,
                    algorithm: module.exports.__config.algorithm,
                    expiresInMinutes: module.exports.__config.tokenExpiresInMinutes
                }
            )
        );
    });
};


/**
 * Create the access jwt token
 * @param {mongoose.Document} user - The mongoose user document to create the token for
 * @param {function} callback - Callback function is called with (error, token) when the token is created
 */
module.exports.createAccessToken = function(user, callback) {

    return process.nextTick(function(){
        callback(
            null,
            jsonwebtoken.sign(
                {sub: user._id.toString()},
                module.exports.__config.tokenSecret,
                {
                    audience: module.exports.__config.audience,
                    issuer: module.exports.__config.issuer,
                    algorithm: module.exports.__config.algorithm,
                    expiresInMinutes: module.exports.__config.tokenExpiresInMinutes
                }
            )
        );
    });
};

/**
 * Create the refresh jwt token
 * @param {mongoose.Document} user - The mongoose user document to create the token for
 * @param {function} callback - Callback function is called with (error, token) when the token is created
 */
module.exports.createRefreshToken = function(user, callback){

    return process.nextTick(function(){
        callback(
            null,
            jsonwebtoken.sign(
                {sub: user._id.toString()},
                module.exports.__config.refreshSecret,
                {
                    audience: module.exports.__config.issuer + '#refresh',
                    issuer: module.exports.__config.issuer,
                    algorithm: module.exports.__config.algorithm,
                    expiresInMinutes: module.exports.__config.refreshExpiresInMinutes
                }
            )
        )
    });
};

/**
 * Create the password reset token that can be mailed for authorizing password resets
 * @param {mongoose.Document} user - The mongoose user document to create the token for
 * @param {function} callback - Callback function is called with (error, token) when the token is created
 */
module.exports.createResetToken = function(user, callback){

    return process.nextTick(function(){
        callback(
            null,
            jsonwebtoken.sign(
                { sub: user._id.toString() },
                module.exports.__config.tokenSecret,
                {
                    audience: module.exports.__config.issuer + '#password-reset',
                    issuer: module.exports.__config.issuer,
                    algorithm: module.exports.__config.algorithm,
                    expiresInMinutes: module.exports.__config.resetExpiresInMinutes
                }
            )
        );
    });
};

/**
 * Create the Identity, Access and Refresh token in one call
 * @param {mongoose.Document} user - The mongoose user document to create the token for
 * @param {function} callback - Callback function is called with (error, iToken, aToken, rToken) when the tokens have been created
 */
module.exports.createTokens = function (user, callback) {

    var token = '';
    var access = '';
    var refresh = '';
    

    async.parallel(
        [
            function createIdentityToken(done) {
                module.exports.createIdentityToken(user, function(err, tok){
                    token = tok;
                    return done(err);
                });
            },

            function createAccessToken(done) {
                module.exports.createAccessToken(user, function(err, tok){
                    access = tok;
                    return done(err);
                });
            },
            
            function createRefreshToken(done) {
                module.exports.createRefreshToken(user, function(err, tok){
                    refresh = tok;
                    done(err);
                });
            }
        ],
        function(err){
            return process.nextTick(function(){
                callback(err, token, access, refresh);
            });
        }
    );
};

/**
 * Verifies a refresh token, 
 * @param rToken
 * @param callback
 */
module.exports.verifyRefreshToken = function(rToken, callback) {

    jsonwebtoken.verify(
        rToken,
        module.exports.__config.refreshSecret,
        {
            audience: module.exports.__config.issuer + '#refresh',
            issuer: module.exports.__config.issuer,
            algorithm: module.exports.__config.algorithm
        },
        callback
    );
};

/**
 * Verifies a reset token,
 * @param rToken
 * @param callback
 */
module.exports.verifyResetToken = function(rToken, callback) {

    jsonwebtoken.verify(
        rToken,
        module.exports.__config.tokenSecret,
        {
            audience: module.exports.__config.issuer + '#password-reset',
            issuer: module.exports.__config.issuer,
            algorithm: module.exports.__config.algorithm
        },
        callback
    );
};