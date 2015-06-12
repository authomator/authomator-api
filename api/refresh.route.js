var router = require('express').Router();
var User = require('../lib/models/user/user.model.js');
var Errors = require('../lib/errors');
var jwt = require('../lib/jwt');


router
    .post('/refresh/:rtoken', function(req, res, next){

        jwt.verifyRefreshToken(req.params.rtoken, function(err, data){
            
            if (err) return res.status(400).json({message: 'Invalid refresh token'});
            
            User.findOne({_id: data.sub}, function(err, doc){

                if (err) return res.status(400).json({message: 'Invalid refresh token'});
                
                if (!doc) return res.status(400).json({message: 'Invalid user refresh token'});
                
                jwt.createTokens(doc, function(err, token, access, refresh){
                    
                    if (err) return res.status(400).json({message: 'Unable to create tokens...soo sorry'});
                    
                    return res.json({it:token, at: access, rt:refresh});
                });
            });
        });
    });

module.exports = exports = router;