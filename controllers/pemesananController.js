const { validationResult } = require('express-validator');
const Pemesanan = require('../models/Pemesanan');
const Jadwal = require('../models/Jadwal');
const User = require('../models/User');

// @desc    Get available seats for a jadwal
// @route   GET /api/pemesanan/jadwal/:jadwalId/seats
// @access  Public
const getAvailableSeats = async (req, res) => {
  try {
    const { jadwalId } = req.params;

    const jadwal = await Jadwal.findById(jadwalId)
      .populate('rute_id', 'lokasi_keberangkatan lokasi_tujuan')
      .populate('armada_id', 'tipe_kendaraan kapasitas');

    if (!jadwal) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal not found'
      });
    }

    const availableSeats = jadwal.getAvailableSeats();
    const seatMap = jadwal.peta_kursi.map(kursi => ({
      nomor_kursi: kursi.nomor_kursi,
      status: kursi.status_kursi,
      tersedia: kursi.status_kursi === 'TERSEDIA'
    }));

    res.json({
      success: true,
      message: 'Seat information retrieved successfully',
      data: {
        jadwal: {
          _id: jadwal._id,
          rute: jadwal.rute_id,
          armada: jadwal.armada_id,
          waktu_keberangkatan: jadwal.waktu_keberangkatan,
          harga_dasar: jadwal.harga_dasar,
          kursi_tersedia: jadwal.kursi_tersedia
        },
        available_seats: availableSeats,
        seat_map: seatMap,
        summary: {
          total_kapasitas: jadwal.armada_id.kapasitas,
          kursi_tersedia: availableSeats.length,
          kursi_terpesan: jadwal.armada_id.kapasitas - availableSeats.length
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
      kontak_darurat,
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

    // Verify jadwal exists and is active
    const jadwal = await Jadwal.findById(jadwal_id)
      .populate('rute_id')
      .populate('armada_id');

    if (!jadwal) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal not found'
      });
    }

    if (jadwal.status_jadwal !== 'AKTIF') {
      return res.status(400).json({
        success: false,
        message: 'Jadwal is not active'
      });
    }

    const jumlahPenumpang = daftar_penumpang.length;

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

    // Calculate pricing
    const hargaPerTiket = jadwal.harga_dasar;
    const totalHarga = hargaPerTiket * jumlahPenumpang;

    // Create pemesanan
    const pemesananData = {
      user_pemesan_id,
      jadwal_id,
      kontak_darurat,
      daftar_penumpang,
      harga_per_tiket: hargaPerTiket,
      jumlah_penumpang: jumlahPenumpang,
      total_harga: totalHarga,
      catatan,
      // Auto-generate required fields
      kode_booking: `TRV${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      batas_waktu_pembayaran: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    };

    const pemesanan = new Pemesanan(pemesananData);
    await pemesanan.save();

    // Book the seats in jadwal
    jadwal.bookSeats(requestedSeats, pemesanan._id);
    await jadwal.save();

    // Populate response data
    await pemesanan.populate('user_pemesan_id', 'name email');
    await pemesanan.populate({
      path: 'jadwal_id',
      populate: [
        { path: 'rute_id', select: 'lokasi_keberangkatan lokasi_tujuan tanggal_keberangkatan' },
        { path: 'armada_id', select: 'tipe_kendaraan kapasitas' }
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

    // Populate related data
    await pemesanan.populate('user_pemesan_id', 'name email phone');
    await pemesanan.populate({
      path: 'jadwal_id',
      populate: [
        { path: 'rute_id', select: 'lokasi_keberangkatan lokasi_tujuan tanggal_keberangkatan' },
        { path: 'armada_id', select: 'tipe_kendaraan kapasitas' }
      ]
    });

    // Check if expired and update status
    if (pemesanan.isExpired()) {
      pemesanan.status_pemesanan = 'EXPIRED';
      await pemesanan.save();
      
      // Release seats
      const jadwal = await Jadwal.findById(pemesanan.jadwal_id);
      if (jadwal) {
        jadwal.releaseSeats(pemesanan.kursi_dipesan);
        await jadwal.save();
      }
    }

    res.json({
      success: true,
      message: 'Pemesanan retrieved successfully',
      data: {
        pemesanan,
        is_expired: pemesanan.isExpired()
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

    // Validate payment amount
    if (jumlah_bayar < pemesanan.total_harga) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount is insufficient'
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
const getUserPemesanan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user_pemesan_id: userId };
    if (status) {
      filter.status_pemesanan = status;
    }

    const skip = (page - 1) * limit;

    const pemesananList = await Pemesanan.find(filter)
      .populate({
        path: 'jadwal_id',
        populate: [
          { path: 'rute_id', select: 'lokasi_keberangkatan lokasi_tujuan tanggal_keberangkatan' },
          { path: 'armada_id', select: 'tipe_kendaraan kapasitas' }
        ]
      })
      .sort({ waktu_pemesanan: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Pemesanan.countDocuments(filter);

    res.json({
      success: true,
      message: 'User pemesanan history retrieved successfully',
      data: {
        pemesanan_list: pemesananList,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
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