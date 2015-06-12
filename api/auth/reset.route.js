var router = require('express').Router(),
    User = require('../../lib/models/user/user.model'),
    Joi = require('joi'),
    jwt = require('../../lib/jwt'),
    validate = require('express-validation');

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
                    return res.status(201).end(); // dont indicate non-existence of a user
                }
    
                mail.sendPasswordReset(user, resetUrl, function(err, info){
                    if (err) next(err);
                    return res.status(201).end(); // dont indicate non-existence of a user
                });
            });
        }
    );

module.exports = router;