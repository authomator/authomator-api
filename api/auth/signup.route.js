var router = require('express').Router(),
    User = require('../../lib/models/user/user.model'),
    Joi = require('joi'),
    jwt = require('../../lib/jwt'),
    validate = require('express-validation');

router
    .post('/signup',

        validate({
            body: {
                email: Joi.string().email().required(),
                password: Joi.string().required()
            }
        }),
    
        function(req, res, next){
            
            User.signup(req.body.email, req.body.password, function(err, doc){
                
                if (err) return next(err);
    
                jwt.createTokens(doc, function(err, it, at, rt){
    
                    if (err) return next(err);
    
                    res.json({it: it, at: at, rt: rt});
                });
            });
        }
    );

module.exports = router;