var ApplicationError = require('./applicationError');

/**
 * Unauthorized Error
 *
 * @api private
 * @param {string} Message
 * @inherits ApplicationError
 */

function ForbiddenError(msg) {
    ApplicationError.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
    this.name = 'ForbiddenError';
};

// Inherits from AccountCenterError
ForbiddenError.prototype.__proto__ = ApplicationError.prototype;

module.exports = exports = ForbiddenError;
