var ApplicationError = require('./applicationError');

/**
 * Resource Not Found Error
 *
 * @api private
 * @param {string} model name
 * @param {string} resource id
 * @inherits ApplicationError
 */

function ResourceNotFoundError(model, id) {
    ApplicationError.call(this, "Resource not found");
    Error.captureStackTrace(this, arguments.callee);
    this.name = 'ResourceNotFoundError';
    this.model = model || '';
    this.id = id || '';
};

// Inherits from ApplicationError
ResourceNotFoundError.prototype.__proto__ = ApplicationError.prototype;

module.exports = exports = ResourceNotFoundError;
