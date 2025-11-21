const express = require('express');
const { body } = require('express-validator');
const { createJadwal, updateJadwal, deleteJadwal } = require('../../controllers/jadwalController');
const { auth, adminAuth } = require('../../middleware/auth');

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(auth);
router.use(adminAuth);

// Validation rules for creating jadwal
const createJadwalValidation = [
  body('rute_id')
    .notEmpty()
    .withMessage('Rute ID is required')
    .isMongoId()
    .withMessage('Rute ID must be a valid MongoDB ObjectId'),
  body('armada_id')
    .notEmpty()
    .withMessage('Armada ID is required')
    .isMongoId()
    .withMessage('Armada ID must be a valid MongoDB ObjectId'),
  body('waktu_keberangkatan')
    .notEmpty()
    .withMessage('Waktu keberangkatan is required')
    .isISO8601()
    .withMessage('Waktu keberangkatan must be a valid datetime (ISO8601 format)'),
  body('estimasi_waktu_perjalanan')
    .notEmpty()
    .withMessage('Estimasi waktu perjalanan is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage('Estimasi waktu perjalanan must be in HH:MM:SS format'),
  body('harga_dasar')
    .notEmpty()
    .withMessage('Harga dasar is required')
    .isNumeric()
    .withMessage('Harga dasar must be a number')
    .isFloat({ min: 0 })
    .withMessage('Harga dasar must be greater than or equal to 0')
];

// Validation rules for updating jadwal
const updateJadwalValidation = [
  body('rute_id')
    .optional()
    .isMongoId()
    .withMessage('Rute ID must be a valid MongoDB ObjectId'),
  body('armada_id')
    .optional()
    .isMongoId()
    .withMessage('Armada ID must be a valid MongoDB ObjectId'),
  body('waktu_keberangkatan')
    .optional()
    .isISO8601()
    .withMessage('Waktu keberangkatan must be a valid datetime (ISO8601 format)'),
  body('estimasi_waktu_perjalanan')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage('Estimasi waktu perjalanan must be in HH:MM:SS format'),
  body('harga_dasar')
    .optional()
    .isNumeric()
    .withMessage('Harga dasar must be a number')
    .isFloat({ min: 0 })
    .withMessage('Harga dasar must be greater than or equal to 0'),
  body('status_jadwal')
    .optional()
    .isIn(['AKTIF', 'BATAL', 'SELESAI', 'DELAY'])
    .withMessage('Status jadwal must be one of: AKTIF, BATAL, SELESAI, DELAY')
];

// @route   POST /api/admin/jadwal
// @desc    Create new jadwal
// @access  Admin
router.post('/', createJadwalValidation, createJadwal);

// @route   PUT /api/admin/jadwal/:id
// @desc    Update jadwal by ID
// @access  Admin
router.put('/:id', updateJadwalValidation, updateJadwal);

// @route   DELETE /api/admin/jadwal/:id
// @desc    Delete jadwal by ID
// @access  Admin
router.delete('/:id', deleteJadwal);

module.exports = router;