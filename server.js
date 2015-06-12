#!/usr/bin/env node
var app = require('./app'),
    http = require('http');


//**************************************************************************
// * START SERVER
// *************************************************************************/

server = http.createServer(app);

console.log('Starting server...');

server.listen(app.get('port'), app.get('address'), function () {
    console.log(app.get('name') + ' listening on ' + app.get('address') + ':' + app.get('port'));
});




