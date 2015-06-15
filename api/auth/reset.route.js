var router = require('express').Router(),
    User = require('../../lib/models/user/user.model'),
    Joi = require('joi'),
    jwt = require('../../lib/jwt'),
    validate = require('express-validation'),
    url = require('url'),
    config = require('../../config'),
    _ = require('lodash'),
    mail = require('../../lib/mail'),
    errors = require('../../lib/errors');

router
    
    .post('/reset/mail',

        validate({
            body: {
                email: Joi.string().email().required(),
                url: Joi.string().uri().required()
            }
        }),
    
        function(req, res, next){
    
            var resetUrl = url.parse(req.body.url, true);
    
            if ( config.mail.resetLinkAllowNonSecure ) logger.warn('Allowing redirect to non https locations !!!');
    
            if (resetUrl.protocol != 'https:' && ! config.mail.resetLinkAllowNonSecure) {
                return next(new errors.ForbiddenError('Unable to set password reset url to non-https location'));
            }
    
            if ( ! _.includes(config.mail.resetLinkAllowedDomains, resetUrl.hostname ) ){
                return next(new errors.ForbiddenError('Unable to set password reset url to unauthorized location'));
            }
    
            User.findOne({'identities.local.email': req.body.email}, function(err, user){
    
                if (err) return next(err);
    
                if (!user) {
                    return res.status(400).end();
                }
    
                mail.sendPasswordReset(user, resetUrl, function(err, info){
                    if (err) next(err);
                    return res.status(201).end(); // dont indicate non-existence of a user
                });
            });
        }
    )

    .post('/reset/mail/:token',

        validate({
            body: {
                password: Joi.string().required()
            },
            params: {
                token: Joi.string().required()
            }
        }),
    
        function(req, res, next){
            
        }
    );

module.exports = router;