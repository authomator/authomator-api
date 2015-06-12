var path = require('path'),
    emailTemplatesDir = path.resolve(__dirname, '../..', 'emails'),
    emailTemplates = require('email-templates'),
    nodemailer = require('nodemailer'),
    jwt = require('../jwt'),
    _ = require('lodash'),
    url = require('url');



// Exported for testability
exports.__config = {};

/**
 * Configure the mail options
 * @param opts
 */
exports.setup = function(opts){
    _.merge(exports.__config, opts);
};


/**
 * Return a nodemailer transport
 *
 * @returns {*}
 */
exports.transport = function() {
    return nodemailer.createTransport(exports.__config);
};


/**
 * Send a password reset link
 * 
 * @param user
 * @param done
 */
exports.sendPasswordReset = function(user, resetUrl, done) {

    emailTemplates(emailTemplatesDir, function(err, template) {

        if (err) return done(err);
        
        jwt.createResetToken(user, function (err, token) {

            if (err) return done(err);

            delete resetUrl.search; // otherwise url.format() will use this as search
            resetUrl.query['reset'] = token;
            
            var locals = {
                user: user,
                link: url.format(resetUrl)
            };

            template('reset-password', locals, function (err, html, text) {
                
                if (err) return done(err);

                exports.transport().sendMail({
                    from: exports.__config.from,
                    to: locals.user.identities.local.email,
                    subject: 'Password reset requested',
                    html: html,
                    text: text
                }, done);
            });
        });
    });
};