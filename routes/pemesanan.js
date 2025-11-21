const express = require('express');
const { body, query, param } = require('express-validator');
const { 
  getAvailableSeats,
  createPemesanan, 
  getPemesanan, 
  processPayment, 
  cancelPemesanan,
  getUserPemesanan
} = require('../controllers/pemesananController');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation for penumpang data
const penumpangValidation = [
  body('daftar_penumpang').isArray({ min: 1, max: 6 }).withMessage('Must provide 1-6 passengers'),
  body('daftar_penumpang.*.nama_lengkap')
    .notEmpty()
    .withMessage('Passenger full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2-100 characters'),
  body('daftar_penumpang.*.tipe_identitas')
    .isIn(['KTP', 'SIM', 'PASPOR', 'KARTU_PELAJAR'])
    .withMessage('Identity type must be KTP, SIM, PASPOR, or KARTU_PELAJAR'),
  body('daftar_penumpang.*.nomor_identitas')
    .notEmpty()
    .withMessage('Identity number is required')
    .isLength({ min: 5, max: 30 })
    .withMessage('Identity number must be between 5-30 characters'),
  body('daftar_penumpang.*.tanggal_lahir')
    .isISO8601()
    .withMessage('Birth date must be in valid date format'),
  body('daftar_penumpang.*.jenis_kelamin')
    .isIn(['L', 'P'])
    .withMessage('Gender must be L or P'),
  body('daftar_penumpang.*.nomor_kursi')
    .notEmpty()
    .withMessage('Seat number is required'),
  body('daftar_penumpang.*.nomor_telepon')
    .optional()
    .isMobilePhone('id-ID')
    .withMessage('Please provide valid Indonesian phone number'),
  body('daftar_penumpang.*.email')
    .optional()
    .isEmail()
    .withMessage('Please provide valid email address')
];

// Validation for creating pemesanan
const createPemesananValidation = [
  body('user_pemesan_id')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('User ID must be valid MongoDB ObjectId'),
  body('jadwal_id')
    .notEmpty()
    .withMessage('Jadwal ID is required')
    .isMongoId()
    .withMessage('Jadwal ID must be valid MongoDB ObjectId'),
  body('kontak_darurat.nama')
    .notEmpty()
    .withMessage('Emergency contact name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Emergency contact name must be between 2-100 characters'),
  body('kontak_darurat.nomor_telepon')
    .notEmpty()
    .withMessage('Emergency contact phone is required')
    .isMobilePhone('id-ID')
    .withMessage('Please provide valid Indonesian phone number'),
  body('kontak_darurat.email')
    .notEmpty()
    .withMessage('Emergency contact email is required')
    .isEmail()
    .withMessage('Please provide valid email address'),
  body('catatan')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  ...penumpangValidation
];

// Validation for payment processing
const paymentValidation = [
  body('metode_pembayaran')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['TRANSFER_BANK', 'QRIS', 'EWALLET', 'CREDIT_CARD', 'CASH'])
    .withMessage('Invalid payment method'),
  body('referensi_pembayaran')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Payment reference must be between 3-100 characters'),
  body('jumlah_bayar')
    .notEmpty()
    .withMessage('Payment amount is required')
    .isNumeric()
    .withMessage('Payment amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Payment amount must be positive')
];

// Validation for cancellation
const cancelValidation = [
  body('alasan')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason must not exceed 500 characters')
];

// Query validation for user history
const userHistoryValidation = [
  query('status')
    .optional()
    .isIn(['MENUNGGU_PEMBAYARAN', 'LUNAS', 'DIBATALKAN', 'EXPIRED', 'REFUND'])
    .withMessage('Invalid status filter'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1-50')
];

// @route   GET /api/pemesanan/jadwal/:jadwalId/seats
// @desc    Get available seats for a jadwal
// @access  Public
router.get('/jadwal/:jadwalId/seats', 
  param('jadwalId').isMongoId().withMessage('Invalid jadwal ID'),
  getAvailableSeats
);

// @route   POST /api/pemesanan
// @desc    Create new pemesanan
// @access  Private (requires authentication)
router.post('/', auth, createPemesananValidation, createPemesanan);

// @route   GET /api/pemesanan/user/:userId
// @desc    Get user's pemesanan history
// @access  Private (requires authentication)
router.get('/user/:userId', 
  auth,
  param('userId').isMongoId().withMessage('Invalid user ID'),
  userHistoryValidation,
  getUserPemesanan
);

// @route   GET /api/pemesanan/:identifier
// @desc    Get pemesanan by ID or booking code
// @access  Private (requires authentication)
router.get('/:identifier', auth, getPemesanan);

// @route   POST /api/pemesanan/:id/payment
// @desc    Process payment for pemesanan
// @access  Private (requires authentication)
router.post('/:id/payment',
  auth,
  param('id').isMongoId().withMessage('Invalid pemesanan ID'),
  paymentValidation,
  processPayment
);

// @route   POST /api/pemesanan/:id/cancel
// @desc    Cancel pemesanan
// @access  Private (requires authentication)
router.post('/:id/cancel',
  auth,
  param('id').isMongoId().withMessage('Invalid pemesanan ID'),
  cancelValidation,
  cancelPemesanan
);

module.exports = router;