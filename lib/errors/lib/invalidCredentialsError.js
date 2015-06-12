var ApplicationError = require('./applicationError');

/**
 * Invalid Credentials Error
 *
 * @api private
 * @inherits ApplicationError
 */

function InvalidCredentialsError() {
    ApplicationError.call(this, "Invalid credentials");
    Error.captureStackTrace(this, arguments.callee);
    this.name = 'InvalidCredentialsError';
};

// Inherits from ApplicationError
InvalidCredentialsError.prototype.__proto__ = ApplicationError.prototype;

module.exports = exports = InvalidCredentialsError;
