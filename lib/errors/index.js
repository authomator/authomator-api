/*!
 * Module exports.
 */

module.exports = exports;

/*!
 * Expose subclasses
 */

exports.InvalidCredentialsError = require('./lib/invalidCredentialsError');
exports.ResourceNotFoundError = require('./lib/resourceNotFoundError');
exports.UnauthorizedError = require('./lib/unauthorizedError');
exports.ForbiddenError = require('./lib/forbiddenError');
exports.FailedDependencyError = require('./lib/failedDependencyError');

exports.middleware = require('./lib/middleware');