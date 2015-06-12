/**************************************************************************
 * LOAD MODULES
 *************************************************************************/

var express = require('express'),
    bodyParser = require('body-parser'),
    logger = require('morgan'),
    config = require('./config'),
    mongoose = require('./lib/mongoose'),
    cors = require('cors'),
    jwt = require('./lib/jwt'),
    mail = require('./lib/mail'),
    api = require('./api'),
    errors = require('./lib/errors');


/**************************************************************************
 * CREATE MAIN EXPRESS APP
 *************************************************************************/

// Instantiate express and export
var app = module.exports = express();


/**************************************************************************
 * CONFIGURATION
 *************************************************************************/

// Define settings
app.set('port', process.env.PORT || config.server.port);
app.set('address', process.env.ADDRESS || config.server.listen);
app.set('name', 'Authomator API service');
app.disable('x-powered-by');
app.disable('etag');


/**************************************************************************
 * COMMON MIDDLEWARE
 *************************************************************************/
app.use(logger('dev'));
app.use(bodyParser.json());

/**************************************************************************
 * APPLICATION SPECIFIC middleware.
 *************************************************************************/
app.use(cors({origin: true, credentials: true}));


/**************************************************************************
 * JWT SETUP
 *************************************************************************/
jwt.setup(config.jwt);


/**************************************************************************
 * MONGODB SETUP
 *************************************************************************/
mongoose.setup(config);


/**************************************************************************
 * NODEMAILER SETUP
 *************************************************************************/
mail.setup(config.mail.transport);
mail.setup({from: config.mail.from});


/**************************************************************************
 * Routes
 *************************************************************************/
app.use('/api', api);

/**************************************************************************
 * ERROR HANDLING MIDDLEWARE
 *************************************************************************/
app.use(errors.middleware());


// Anything not matched by previous middleware or routing is considered 404
// it is important to keep this in here so that anything underneath /api is getting proper
// 404
app.use(function(req, res, next){
    res.sendStatus(404);
});