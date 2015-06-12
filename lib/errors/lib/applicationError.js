/**
 * Application Error constructor
 *
 * @param {String} msg Error message
 * @inherits Error https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error
 */

function ApplicationError(msg) {
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.message = msg;
    this.name = 'ApplicationError';
};

/*!
 * Inherits from Error.
 */

ApplicationError.prototype.__proto__ = Error.prototype;

/*!
 * Module exports.
 */

module.exports = exports = ApplicationError;