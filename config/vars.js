
var appname = 'authomator';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = exports = {

    appname             : appname,
    env                 : process.env.NODE_ENV,
    mongodb_ip          : process.env.MONGODB_IP || '127.0.0.1',
    mongodb_collection  : process.env.MONGODB_COLLECTION || appname + '-' + process.env.NODE_ENV,
    port                : process.env.PORT || 3000,
    listen              : process.env.LISTEN || '0.0.0.0'
};
