const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists');
  }

  // Create new user (password is hashed in pre-save hook)
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toJSON(),
      token,
    },
  });
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  // Explicitly select password for verification
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      token,
    },
  });
});

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/profile
 * @access  Private (Protected by JWT)
 */
const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: {
      user: req.user,
    },
  });
});

module.exports = {
  register,
  login,
  getProfile,
};
