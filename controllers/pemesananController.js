const { validationResult } = require('express-validator');
const Pemesanan = require('../models/Pemesanan');
const Jadwal = require('../models/Jadwal');
const User = require('../models/User');

// @desc    Get available seats for a jadwal
// @route   GET /api/pemesanan/jadwal/:jadwalId/seats
// @access  Public
// 
// 🪑 HALAMAN PILIH KURSI (/booking/[jadwalId]) - IMPLEMENTASI DATABASE:
// 📊 AGREGASI: Hitung kursi tersedia vs terisi, summary kapasitas total
// 🔄 SORTING: Urutkan kursi A1, A2, A3... atau 1, 2, 3... (di frontend)
// 🔗 JOIN: Ambil detail jadwal + rute + armada untuk info lengkap
const getAvailableSeats = async (req, res) => {
  try {
    const { jadwalId } = req.params;

    // 🔗 JOIN: Ambil jadwal dengan data rute & armada untuk seat map
    const jadwal = await Jadwal.findById(jadwalId)
      .populate('rute_id', 'lokasi_keberangkatan lokasi_tujuan')  // 🔗 JOIN: Info rute perjalanan
      .populate('armada_id', 'tipe_kendaraan kapasitas');         // 🔗 JOIN: Info tipe bus & kapasitas

    if (!jadwal) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal not found'
      });
    }

    // 📊 AGREGASI: Hitung & filter kursi yang tersedia dari peta kursi
    const availableSeats = jadwal.getAvailableSeats();  // 📊 AGREGASI: Filter kursi dengan status 'TERSEDIA'
    const seatMap = jadwal.peta_kursi.map(kursi => ({   // Transform data untuk frontend
      nomor_kursi: kursi.nomor_kursi,
      status: kursi.status_kursi,
      tersedia: kursi.status_kursi === 'TERSEDIA'
    }));

    // 🪑 RESPONSE: Data lengkap untuk halaman pilih kursi
    res.json({
      success: true,
      message: 'Seat information retrieved successfully',
      data: {
        jadwal: {                                    // 🔗 JOIN: Data jadwal dengan relasi
          _id: jadwal._id,
          rute: jadwal.rute_id,                      // 🔗 JOIN: Info rute perjalanan
          armada: jadwal.armada_id,                  // 🔗 JOIN: Info armada/bus
          waktu_keberangkatan: jadwal.waktu_keberangkatan,
          harga_dasar: jadwal.harga_dasar,
          kursi_tersedia: jadwal.kursi_tersedia
        },
        available_seats: availableSeats,             // 📊 AGREGASI: Array kursi yang bisa dipilih
        seat_map: seatMap,                           // 🔄 SORTING: Peta kursi terurut untuk UI
        summary: {  // 📊 AGREGASI: Summary kursi untuk UI halaman pilih kursi
          total_kapasitas: jadwal.armada_id.kapasitas,                      // Total kursi bus
          kursi_tersedia: availableSeats.length,                            // 📊 AGREGASI: Hitung kursi kosong
          kursi_terpesan: jadwal.armada_id.kapasitas - availableSeats.length // 📊 AGREGASI: Hitung kursi terisi
        }
      }
    });

  } catch (error) {
    console.error('Get available seats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching seat information'
    });
  }
};

// @desc    Create new pemesanan
// @route   POST /api/pemesanan
// @access  Public
// 
// 📊 AGREGASI: Hitung total harga (harga_per_tiket × jumlah_penumpang)
// 🔗 JOIN: Populate response dengan user, jadwal, rute, armada (3 level join)
const createPemesanan = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { 
      user_pemesan_id, 
      jadwal_id, 
      daftar_penumpang,
      catatan
    } = req.body;

    // Verify user exists
    const user = await User.findById(user_pemesan_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 🔗 JOIN: Verify jadwal exists dengan populate rute & armada
    const jadwal = await Jadwal.findById(jadwal_id)
      .populate('rute_id')   // 🔗 JOIN: Data rute untuk validasi
      .populate('armada_id'); // 🔗 JOIN: Data armada untuk validasi

    if (!jadwal) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal not found'
      });
    }

    // Skip jadwal status check since model doesn't have status_jadwal field
    // if (jadwal.status_jadwal !== 'AKTIF') {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Jadwal is not active'
    //   });
    // }

    const jumlahPenumpang = daftar_penumpang.length;

    // Check maximum passengers per booking (4)
    if (jumlahPenumpang > 4) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 4 passengers per booking'
      });
    }

    // Check seat availability
    if (jadwal.kursi_tersedia < jumlahPenumpang) {
      return res.status(400).json({
        success: false,
        message: `Only ${jadwal.kursi_tersedia} seats available`
      });
    }

    // Validate and check specific seat availability
    const requestedSeats = daftar_penumpang.map(p => p.nomor_kursi);
    const duplicateSeats = requestedSeats.filter((seat, index) => requestedSeats.indexOf(seat) !== index);
    
    if (duplicateSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Duplicate seats selected: ${duplicateSeats.join(', ')}`
      });
    }

    for (const seatNumber of requestedSeats) {
      if (!jadwal.isSeatAvailable(seatNumber)) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seatNumber} is not available`
        });
      }
    }

    // 📊 AGREGASI: Calculate total pricing
    const hargaPerTiket = jadwal.harga_dasar;
    const totalHarga = hargaPerTiket * jumlahPenumpang;  // 📊 AGREGASI: Total harga = harga × jumlah penumpang

    // Create pemesanan
    const pemesananData = {
      user_pemesan_id,
      jadwal_id,
      daftar_penumpang,
      harga_per_tiket: hargaPerTiket,
      jumlah_penumpang: jumlahPenumpang,
      total_harga: totalHarga,
      catatan,
      // Auto-generate required fields
      kode_booking: `TRV${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      batas_waktu_pembayaran: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
    };

    const pemesanan = new Pemesanan(pemesananData);
    await pemesanan.save();

    // Book the seats in jadwal
    jadwal.bookSeats(requestedSeats, pemesanan._id);
    await jadwal.save();

    // 🔗 JOIN: Populate response dengan data lengkap (3 level join)
    await pemesanan.populate('user_pemesan_id', 'name email');  // 🔗 JOIN Level 1: User data
    await pemesanan.populate({
      path: 'jadwal_id',                                          // 🔗 JOIN Level 2: Jadwal data
      populate: [
        { path: 'rute_id', select: 'lokasi_keberangkatan lokasi_tujuan' },   // 🔗 JOIN Level 3A: Rute data
        { path: 'armada_id', select: 'tipe_kendaraan kapasitas' }            // 🔗 JOIN Level 3B: Armada data
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Pemesanan created successfully',
      data: {
        pemesanan,
        payment_info: {
          kode_booking: pemesanan.kode_booking,
          total_amount: pemesanan.total_harga,
          payment_deadline: pemesanan.batas_waktu_pembayaran,
          status: 'MENUNGGU_PEMBAYARAN'
        }
      }
    });

  } catch (error) {
    console.error('Create pemesanan error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating pemesanan'
    });
  }
};

// @desc    Get pemesanan by ID or booking code
// @route   GET /api/pemesanan/:identifier
// @access  Public
// 
// 🎫 HALAMAN DETAIL PEMESANAN - IMPLEMENTASI DATABASE:
// 🔗 JOIN: 3 level join untuk data super lengkap (Pemesanan → Jadwal → Rute/Armada)
// 📊 AGREGASI: Kalkulasi total harga, status kursi, validasi expired
const getPemesanan = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to find by ObjectId first, then by booking code
    let pemesanan;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a valid ObjectId
      pemesanan = await Pemesanan.findById(identifier);
    } else {
      // Search by booking code
      pemesanan = await Pemesanan.findOne({ kode_booking: identifier });
    }

    if (!pemesanan) {
      return res.status(404).json({
        success: false,
        message: 'Pemesanan not found'
      });
    }

    // 🎫 JOIN: 3 level join untuk halaman detail pemesanan super lengkap
    await pemesanan.populate('user_pemesan_id', 'name email phone');  // 🔗 JOIN Level 1: Data pemesan
    await pemesanan.populate({
      path: 'jadwal_id',                                          // 🔗 JOIN Level 2: Data jadwal
      populate: [
        { path: 'rute_id', select: 'lokasi_keberangkatan lokasi_tujuan' },   // 🔗 JOIN Level 3A: Detail rute
        { path: 'armada_id', select: 'tipe_kendaraan kapasitas' }            // 🔗 JOIN Level 3B: Detail armada
      ]
    });

    // 📊 AGREGASI: Check expired status dan update otomatis
    if (pemesanan.isExpired()) {                    // 📊 AGREGASI: Compare current time vs deadline
      pemesanan.status_pemesanan = 'EXPIRED';
      await pemesanan.save();
      
      // Release seats
      const jadwal = await Jadwal.findById(pemesanan.jadwal_id);
      if (jadwal) {
        jadwal.releaseSeats(pemesanan.kursi_dipesan);
        await jadwal.save();
      }
    }

    // 🎫 RESPONSE: Data lengkap untuk halaman detail pemesanan
    res.json({
      success: true,
      message: 'Pemesanan retrieved successfully',
      data: {
        pemesanan,                                  // 🔗 JOIN: Data pemesanan dengan 3 level relasi
        is_expired: pemesanan.isExpired()          // 📊 AGREGASI: Status expired calculation
      }
    });

  } catch (error) {
    console.error('Get pemesanan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pemesanan'
    });
  }
};

// @desc    Process payment
// @route   POST /api/pemesanan/:id/payment
// @access  Public
// 
// 💳 PROSES PEMBAYARAN - IMPLEMENTASI DATABASE:
// 📊 AGREGASI: Validasi jumlah pembayaran vs total harga pemesanan
const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { metode_pembayaran, referensi_pembayaran, jumlah_bayar } = req.body;

    const pemesanan = await Pemesanan.findById(id);
    if (!pemesanan) {
      return res.status(404).json({
        success: false,
        message: 'Pemesanan not found'
      });
    }

    // Check if already paid
    if (pemesanan.status_pemesanan === 'LUNAS') {
      return res.status(400).json({
        success: false,
        message: 'Pemesanan already paid'
      });
    }

    // Check if expired
    if (pemesanan.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Payment deadline has expired'
      });
    }

    // 📊 AGREGASI: Validate payment amount vs total harga
    if (jumlah_bayar < pemesanan.total_harga) {        // 📊 AGREGASI: Compare payment vs calculated total
      return res.status(400).json({
        success: false,
        message: 'Payment amount is insufficient'         // 📊 AGREGASI: Validation result
      });
    }

    // Update payment information
    pemesanan.status_pemesanan = 'LUNAS';
    pemesanan.pembayaran = {
      metode_pembayaran,
      referensi_pembayaran,
      waktu_pembayaran: new Date(),
      jumlah_bayar
    };

    await pemesanan.save();

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        kode_booking: pemesanan.kode_booking,
        status: pemesanan.status_pemesanan,
        payment_details: pemesanan.pembayaran,
        seats_booked: pemesanan.kursi_dipesan
      }
    });

  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing payment'
    });
  }
};

// @desc    Cancel pemesanan
// @route   POST /api/pemesanan/:id/cancel
// @access  Public
const cancelPemesanan = async (req, res) => {
  try {
    const { id } = req.params;
    const { alasan } = req.body;

    const pemesanan = await Pemesanan.findById(id);
    if (!pemesanan) {
      return res.status(404).json({
        success: false,
        message: 'Pemesanan not found'
      });
    }

    if (pemesanan.status_pemesanan === 'DIBATALKAN') {
      return res.status(400).json({
        success: false,
        message: 'Pemesanan already cancelled'
      });
    }

    // Check if jadwal has departed
    const jadwal = await Jadwal.findById(pemesanan.jadwal_id);
    if (jadwal && new Date() > jadwal.waktu_keberangkatan) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel after departure'
      });
    }

    // Update status and add cancellation note
    pemesanan.status_pemesanan = 'DIBATALKAN';
    pemesanan.catatan = `${pemesanan.catatan || ''}\n[CANCELLED] ${alasan || 'No reason provided'}`.trim();
    await pemesanan.save();

    // Release seats
    if (jadwal) {
      jadwal.releaseSeats(pemesanan.kursi_dipesan);
      await jadwal.save();
    }

    res.json({
      success: true,
      message: 'Pemesanan cancelled successfully',
      data: {
        kode_booking: pemesanan.kode_booking,
        status: pemesanan.status_pemesanan,
        cancelled_at: new Date(),
        refund_info: pemesanan.status_pemesanan === 'LUNAS' ? {
          eligible: true,
          amount: pemesanan.total_harga,
          processing_time: '3-5 business days'
        } : null
      }
    });

  } catch (error) {
    console.error('Cancel pemesanan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling pemesanan'
    });
  }
};

// @desc    Get user's pemesanan history
// @route   GET /api/pemesanan/user/:userId
// @access  Public
// 
// 📝 HALAMAN RIWAYAT PEMESANAN (/pemesanan) - IMPLEMENTASI DATABASE:
// 📊 AGREGASI: Hitung total pemesanan user dengan countDocuments
// 🔄 SORTING: Urutkan dari pemesanan terbaru (waktu_pemesanan DESC)
// 📄 LIMIT: Tampilkan 10 riwayat per halaman dengan pagination
// 🔗 JOIN: Pemesanan + jadwal + rute + armada (lengkap!)
const getUserPemesanan = async (req, res) => {
  try {
    const { userId } = req.params;
    // 📄 LIMIT: Extract pagination dengan default 10 history per halaman
    const { status, page = 1, limit = 10 } = req.query;  // 📄 LIMIT: Default limit

    const filter = { user_pemesan_id: userId };
    if (status) {
      filter.status_pemesanan = status;  // Filter berdasarkan status jika ada
    }

    const skip = (page - 1) * limit;  // 📄 LIMIT: Calculate pagination offset

    // 🔗 JOIN + 🔄 SORTING + 📄 LIMIT: Query history dengan nested populate, sort, pagination
    const pemesananList = await Pemesanan.find(filter)
      .populate({                                        // 🔗 JOIN: Nested populate untuk data lengkap
        path: 'jadwal_id',                              // 🔗 JOIN Level 1: Jadwal
        populate: [
          { path: 'rute_id', select: 'lokasi_keberangkatan lokasi_tujuan' },   // 🔗 JOIN Level 2A: Rute
          { path: 'armada_id', select: 'tipe_kendaraan kapasitas' }            // 🔗 JOIN Level 2B: Armada
        ]
      })
      .sort({ waktu_pemesanan: -1 })                   // 🔄 SORTING: History terbaru dulu (DESC)
      .skip(skip)                                      // 📄 LIMIT: Skip untuk pagination
      .limit(parseInt(limit));                         // 📄 LIMIT: Batasi hasil per halaman

    // 📊 AGREGASI: Hitung total pemesanan untuk pagination info
    const total = await Pemesanan.countDocuments(filter);  // 📊 AGREGASI: Count total history

    // 📝 RESPONSE: Data lengkap untuk halaman riwayat pemesanan
    res.json({
      success: true,
      message: 'User pemesanan history retrieved successfully',
      data: {
        pemesanan_list: pemesananList,                   // 🔗 JOIN: History dengan detail lengkap
        pagination: {                                    // 📊 AGREGASI: Pagination metadata untuk UI
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),         // 📊 AGREGASI: Total halaman (pembulatan ke atas)
          total_items: total,                            // 📊 AGREGASI: Total riwayat dari countDocuments
          items_per_page: parseInt(limit)                // 📄 LIMIT: 10 riwayat per halaman
        }
      }
    });

  } catch (error) {
    console.error('Get user pemesanan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user pemesanan'
    });
  }
};

module.exports = {
  getAvailableSeats,
  createPemesanan,
  getPemesanan,
  processPayment,
  cancelPemesanan,
  getUserPemesanan
};