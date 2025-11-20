const express = require('express');
const { body } = require('express-validator');
const { getProfile, updateProfile } = require('../controllers/userController');

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
    .withMessage('Please enter a valid phone number'),
  body('role')
    .optional()
    .isIn(['customer', 'admin'])
    .withMessage('Role must be either customer or admin')
];

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/:id', getProfile);

// @route   PUT /api/users/:id
// @desc    Update user profile by ID
// @access  Public
router.put('/:id', updateProfileValidation, updateProfile);

module.exports = router;