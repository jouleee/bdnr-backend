const express = require('express');
const { body } = require('express-validator');
const { getProfile, updateProfile } = require('../controllers/userController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation rules for profile update
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s]+$/)
    .withMessage('Please enter a valid phone number')
];

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Private (requires authentication)
router.get('/:id', auth, getProfile);

// @route   PUT /api/users/:id
// @desc    Update user profile by ID
// @access  Private (requires authentication, own profile only)
router.put('/:id', auth, updateProfileValidation, updateProfile);

module.exports = router;