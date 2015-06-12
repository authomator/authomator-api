var router = require('express').Router();

router.use(require('./login.route'));
router.use(require('./signup.route'));
router.use(require('./reset.route'));
    
module.exports = exports = router;