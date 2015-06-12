'use strict';

var _ = require('lodash'),
    path = require('path'),
    fs = require('fs'),
    vars = require('./vars');

/**************************************************************************
 * All configurations will extend these options
 *************************************************************************/

var defaults =  {

    server: {
        listen: vars.listen,
        port: vars.port,
        url: 'http://127.0.0.1'
    },
    
    mail : {
        from: 'authomater@local',
        transport: {
            service: 'Mandrill',
            auth: {
                user: 'some@email.be',
                pass: 'someapikey'
            }
        },
        resetLinkAllowedDomains : ['127.0.0.1', 'localhost'],
        resetLinkAllowNonSecure : false // https only
    },
    
    jwt: {
        audience:                   vars.appname + '-audience',
        issuer:                     vars.appname,
        algorithm:                  "HS512",
        tokenExpiresInMinutes:      60,
        refreshExpiresInMinutes:    60,
        resetExpiresInMinutes:      60,
        
                                    // openssl rand -base64 50
        tokenSecret:                "Iu+DOXws4q+/DrngmXkHCdzUfXSxFMT8hRU3Ng16QrcGsNAg5ztAUtcUFUOu0UxK6do=",
        refreshSecret:              "O5C/Mi7mGRsFqr4X7q4Ycg/Rb966bWgD96vjmUckMR0wQWu8HFOHI8JB7i1HjEyNotw="
    },
    
    mongoose: {
        url: "mongodb://" + vars.mongodb_ip + "/" + vars.mongodb_collection,
        options: {
            db: { native_parser: true }
        }
    }
};


/**************************************************************************
 * Apply local config if present
 *************************************************************************/

if (fs.existsSync(path.resolve(__dirname, 'local.js'))){
    var environment = _.merge(
        defaults,
        require('./local.js') || {}
    );
}

/**************************************************************************
 * Export config
 *************************************************************************/
module.exports = defaults;