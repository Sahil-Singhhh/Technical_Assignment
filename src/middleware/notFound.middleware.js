const ApiError = require('../utils/ApiError');

/**
 * 404 Not Found handler for undefined routes
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = notFound;
