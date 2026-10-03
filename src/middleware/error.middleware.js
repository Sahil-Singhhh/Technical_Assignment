const ApiError = require('../utils/ApiError');

/**
 * Global centralized error handler middleware
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // If error is not an instance of ApiError, convert it
  if (!(error instanceof ApiError)) {
    // Handle Mongoose Bad ObjectId / CastError
    if (err.name === 'CastError') {
      const message = `Invalid value '${err.value}' for field '${err.path}'`;
      error = ApiError.badRequest(message, [{ field: err.path, message }]);
    }
    // Handle Mongoose Duplicate Key Error (code 11000)
    else if (err.code === 11000) {
      const fields = Object.keys(err.keyValue || {});
      const field = fields[0] || 'field';
      const value = err.keyValue ? err.keyValue[field] : '';
      const message = `Duplicate value '${value}' entered for ${field}. It must be unique.`;
      error = ApiError.conflict(message, [{ field, message }]);
    }
    // Handle Mongoose Validation Error
    else if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((el) => ({
        field: el.path,
        message: el.message,
      }));
      error = ApiError.badRequest('Database validation failed', errors);
    }
    // Handle JWT Invalid Token
    else if (err.name === 'JsonWebTokenError') {
      error = ApiError.unauthorized('Invalid authentication token');
    }
    // Handle JWT Expired Token
    else if (err.name === 'TokenExpiredError') {
      error = ApiError.unauthorized('Authentication token has expired');
    }
    // Handle JSON syntax error in body parsing
    else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      error = ApiError.badRequest('Invalid JSON syntax in request body');
    }
    // Generic / Unhandled Server Error
    else {
      const statusCode = err.statusCode || 500;
      const message =
        process.env.NODE_ENV === 'production' && statusCode === 500
          ? 'Internal Server Error'
          : err.message || 'Internal Server Error';
      error = new ApiError(statusCode, message, [], err.stack);
    }
  }

  const statusCode = error.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  const response = {
    success: false,
    message: error.message || 'An unexpected error occurred',
    errors: error.errors && error.errors.length > 0 ? error.errors : [],
  };

  if (!isProd && error.stack) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
