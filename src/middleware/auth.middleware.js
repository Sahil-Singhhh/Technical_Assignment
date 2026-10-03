const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Protect routes by verifying Bearer JWT token in Authorization header
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(
      ApiError.unauthorized('Access denied. No authentication token provided')
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(
        ApiError.unauthorized('The user belonging to this token no longer exists')
      );
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Authentication token has expired. Please log in again'));
    }
    return next(ApiError.unauthorized('Invalid authentication token'));
  }
});

module.exports = {
  protect,
};
