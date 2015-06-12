var ApplicationError = require('./applicationError');

/**
 * Failed Dependency Error (used i.e when a delete is not possible due to a dependent document)
 *
 * @api private
 * @inherits ApplicationError
 */

function FailedDependencyError(message) {
    ApplicationError.call(this, message);
    Error.captureStackTrace(this, arguments.callee);
    this.name = 'FailedDependencyError';
};

// Inherits from ApplicationError
FailedDependencyError.prototype.__proto__ = ApplicationError.prototype;

module.exports = exports = FailedDependencyError;