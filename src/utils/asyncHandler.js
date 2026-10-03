/**
 * Wraps asynchronous Express middleware / route handlers to catch any errors and forward to next()
 * @param {Function} fn - Asynchronous route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
