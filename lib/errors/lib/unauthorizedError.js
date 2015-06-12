var ApplicationError = require('./applicationError');

/**
 * Unauthorized Error
 *
 * @api private
 * @param {string} model name
 * @param {string} resource id
 * @inherits ApplicationError
 */

function UnauthorizedError(model, id) {
    ApplicationError.call(this, "Not authorized");
    Error.captureStackTrace(this, arguments.callee);
    this.name = 'UnauthorizedError';
};

// Inherits from AccountCenterError
UnauthorizedError.prototype.__proto__ = ApplicationError.prototype;

module.exports = exports = UnauthorizedError;
