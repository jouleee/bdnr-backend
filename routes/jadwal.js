const express = require('express');
const { query } = require('express-validator');
const { getAllJadwal, getJadwalById } = require('../controllers/jadwalController');

const router = express.Router();

// Validation rules for searching jadwal
const searchJadwalValidation = [
  query('lokasi_keberangkatan')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Lokasi keberangkatan must be at least 2 characters'),
  query('lokasi_tujuan')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Lokasi tujuan must be at least 2 characters'),
  query('tanggal_keberangkatan')
    .optional()
    .isISO8601()
    .withMessage('Tanggal keberangkatan must be a valid date (YYYY-MM-DD)'),
  query('status_jadwal')
    .optional()
    .isIn(['AKTIF', 'BATAL', 'SELESAI', 'DELAY'])
    .withMessage('Status jadwal must be one of: AKTIF, BATAL, SELESAI, DELAY'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// @route   GET /api/jadwal
// @desc    Get all jadwal with search and filter
// @access  Public
router.get('/', searchJadwalValidation, getAllJadwal);

// @route   GET /api/jadwal/:id
// @desc    Get jadwal by ID
// @access  Public
router.get('/:id', getJadwalById);

module.exports = router;