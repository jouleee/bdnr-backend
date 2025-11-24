// Test script untuk create pemesanan
const { validationResult, body } = require('express-validator');

// Contoh data yang akan dikirim dari frontend
const testData = {
  user_pemesan_id: "507f1f77bcf86cd799439011", // Sample ObjectId
  jadwal_id: "507f1f77bcf86cd799439012", // Sample ObjectId
  daftar_penumpang: [
    {
      nama_lengkap: "John Doe",
      nomor_kursi: "A1",
      tipe_identitas: "KTP",
      nomor_identitas: "-",
      tanggal_lahir: new Date('1990-01-01').toISOString(),
      jenis_kelamin: "L",
      nomor_telepon: "081234567890",
      email: "john@example.com"
    }
  ],
  catatan: "Test booking"
};

console.log('📦 Test data that will be sent:');
console.log(JSON.stringify(testData, null, 2));

// Validation functions
const penumpangValidation = [
  body('daftar_penumpang').isArray({ min: 1, max: 4 }).withMessage('Must provide 1-4 passengers'),
  body('daftar_penumpang.*.nama_lengkap')
    .notEmpty()
    .withMessage('Passenger full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2-100 characters'),
  body('daftar_penumpang.*.nomor_kursi')
    .notEmpty()
    .withMessage('Seat number is required')
];

console.log('✅ Validation should pass for this data');