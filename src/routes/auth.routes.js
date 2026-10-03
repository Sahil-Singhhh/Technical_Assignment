const express = require('express');
const {
  register,
  login,
  getProfile,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  registerSchema,
  loginSchema,
} = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', validate(registerSchema, 'body'), register);
router.post('/login', validate(loginSchema, 'body'), login);
router.get('/profile', protect, getProfile);

module.exports = router;
