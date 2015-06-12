var router = require('express').Router(),
    auth = require('./auth');

router.use('/auth', auth);
router.use(require('./refresh.route'));
    
exports = module.exports = router;