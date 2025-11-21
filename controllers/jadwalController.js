const { validationResult } = require('express-validator');
const Jadwal = require('../models/Jadwal');
const Rute = require('../models/Rute');
const Armada = require('../models/Armada');

// @desc    Get all jadwal with search functionality
// @route   GET /api/jadwal
// @access  Public
const getAllJadwal = async (req, res) => {
  try {
    const {
      lokasi_keberangkatan,
      lokasi_tujuan,
      tanggal_keberangkatan,
      status_jadwal,
      page = 1,
      limit = 10
    } = req.query;

    console.log('🔍 Received query params:', {
      lokasi_keberangkatan,
      lokasi_tujuan,
      tanggal_keberangkatan,
      status_jadwal,
      page,
      limit
    });

    // Build filter object - start with empty filter to get all jadwal
    const filter = {};
    
    // Only add status filter if explicitly provided
    if (status_jadwal) {
      filter.status_jadwal = status_jadwal;
    }

    // Add date filter on Jadwal (waktu_keberangkatan) if provided
    // Use Indonesia timezone (GMT+7) to match user's local date
    if (tanggal_keberangkatan) {
      // Create date at midnight Indonesia time (GMT+7)
      const startDate = new Date(tanggal_keberangkatan + 'T00:00:00+07:00');
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.waktu_keberangkatan = { $gte: startDate, $lt: endDate };
    }

    // Build rute filter (without date)
    const ruteFilter = {};

    if (lokasi_keberangkatan) {
      ruteFilter.lokasi_keberangkatan = new RegExp(lokasi_keberangkatan, 'i');
    }
    if (lokasi_tujuan) {
      ruteFilter.lokasi_tujuan = new RegExp(lokasi_tujuan, 'i');
    }

    console.log('🔎 Rute filter:', JSON.stringify(ruteFilter, null, 2));
    console.log('📅 Jadwal filter:', JSON.stringify(filter, null, 2));

    // If we have rute filters, first find matching rutes
    let ruteIds = [];
    if (Object.keys(ruteFilter).length > 0) {
      const rutes = await Rute.find(ruteFilter).select('_id');
      ruteIds = rutes.map(rute => rute._id);
      
      console.log(`📍 Found ${rutes.length} matching rutes`);
      
      // If no rutes found with the filter, return empty result
      if (ruteIds.length === 0) {
        console.log('❌ No matching rutes found');
        return res.json({
          success: true,
          message: 'No jadwal found matching the criteria',
          data: {
            jadwals: [],
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: parseInt(limit)
            }
          }
        });
      }
      
      filter.rute_id = { $in: ruteIds };
    }

    console.log('✅ Final filter applied:', JSON.stringify(filter, null, 2));

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get jadwal with populated data
    const jadwals = await Jadwal.find(filter)
      .populate('rute_id', 'lokasi_keberangkatan lokasi_tujuan tanggal_keberangkatan')
      .populate('armada_id', 'tipe_kendaraan kapasitas nomor_plat status')
      .sort({ waktu_keberangkatan: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Jadwal.countDocuments(filter);

    console.log(`✅ Found ${jadwals.length} jadwals out of ${total} total`);

    res.json({
      success: true,
      message: jadwals.length > 0 ? 'Jadwal retrieved successfully' : 'No jadwal found',
      data: {
        jadwals,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all jadwal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching jadwal'
    });
  }
};

// @desc    Get jadwal by ID
// @route   GET /api/jadwal/:id
// @access  Public
const getJadwalById = async (req, res) => {
  try {
    const jadwalId = req.params.id;

    const jadwal = await Jadwal.findById(jadwalId)
      .populate('rute_id', 'lokasi_keberangkatan lokasi_tujuan tanggal_keberangkatan')
      .populate('armada_id', 'tipe_kendaraan kapasitas nomor_plat status');

    if (!jadwal) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal not found'
      });
    }

    res.json({
      success: true,
      message: 'Jadwal detail retrieved successfully',
      data: {
        jadwal
      }
    });
  } catch (error) {
    console.error('Get jadwal by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid jadwal ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching jadwal detail'
    });
  }
};

// @desc    Create new jadwal (Admin only)
// @route   POST /api/admin/jadwal
// @access  Public (for now, would be admin only in production)
const createJadwal = async (req, res) => {
  try {
    console.log('📝 CREATE JADWAL REQUEST:', {
      user: req.user?.email,
      role: req.user?.role,
      body: req.body
    });
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { rute_id, armada_id, waktu_keberangkatan, estimasi_waktu_perjalanan, harga_dasar } = req.body;

    // Verify rute exists
    const rute = await Rute.findById(rute_id);
    if (!rute) {
      console.log('❌ Rute not found:', rute_id);
      return res.status(404).json({
        success: false,
        message: 'Rute not found'
      });
    }

    // Verify armada exists and is active
    const armada = await Armada.findById(armada_id);
    if (!armada) {
      console.log('❌ Armada not found:', armada_id);
      return res.status(404).json({
        success: false,
        message: 'Armada not found'
      });
    }

    if (armada.status !== 'AKTIF') {
      console.log('❌ Armada not active:', armada.status);
      return res.status(400).json({
        success: false,
        message: 'Armada is not active'
      });
    }

    // Check for conflicting schedules (same armada at same time)
    const conflictingSchedule = await Jadwal.findOne({
      armada_id,
      waktu_keberangkatan: new Date(waktu_keberangkatan),
      status_jadwal: { $in: ['AKTIF', 'DELAY'] }
    });

    if (conflictingSchedule) {
      return res.status(409).json({
        success: false,
        message: 'Armada already has a schedule at this time'
      });
    }

    // Create new jadwal
    const jadwal = new Jadwal({
      rute_id,
      armada_id,
      waktu_keberangkatan: new Date(waktu_keberangkatan),
      estimasi_waktu_perjalanan,
      harga_dasar
    });

    await jadwal.save();

    // Populate the created jadwal
    await jadwal.populate('rute_id', 'lokasi_keberangkatan lokasi_tujuan tanggal_keberangkatan');
    await jadwal.populate('armada_id', 'tipe_kendaraan kapasitas nomor_plat status');

    console.log('✅ Jadwal created successfully:', jadwal._id);

    res.status(201).json({
      success: true,
      message: 'Jadwal created successfully',
      data: {
        jadwal
      }
    });
  } catch (error) {
    console.error('❌ Create jadwal error:', error);
    
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
      message: 'Server error while creating jadwal'
    });
  }
};

// @desc    Update jadwal (Admin only)
// @route   PUT /api/admin/jadwal/:id
// @access  Public (for now, would be admin only in production)
const updateJadwal = async (req, res) => {
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

    const jadwalId = req.params.id;
    const { rute_id, armada_id, waktu_keberangkatan, estimasi_waktu_perjalanan, harga_dasar, status_jadwal } = req.body;

    // Find existing jadwal
    const existingJadwal = await Jadwal.findById(jadwalId);
    if (!existingJadwal) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal not found'
      });
    }

    // Build update object
    const updateData = {};
    if (rute_id !== undefined) updateData.rute_id = rute_id;
    if (armada_id !== undefined) updateData.armada_id = armada_id;
    if (waktu_keberangkatan !== undefined) updateData.waktu_keberangkatan = new Date(waktu_keberangkatan);
    if (estimasi_waktu_perjalanan !== undefined) updateData.estimasi_waktu_perjalanan = estimasi_waktu_perjalanan;
    if (harga_dasar !== undefined) updateData.harga_dasar = harga_dasar;
    if (status_jadwal !== undefined) updateData.status_jadwal = status_jadwal;

    // Verify references if being updated
    if (rute_id) {
      const rute = await Rute.findById(rute_id);
      if (!rute) {
        return res.status(404).json({
          success: false,
          message: 'Rute not found'
        });
      }
    }

    if (armada_id) {
      const armada = await Armada.findById(armada_id);
      if (!armada) {
        return res.status(404).json({
          success: false,
          message: 'Armada not found'
        });
      }
    }

    // Update jadwal
    const updatedJadwal = await Jadwal.findByIdAndUpdate(
      jadwalId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('rute_id', 'lokasi_keberangkatan lokasi_tujuan tanggal_keberangkatan')
    .populate('armada_id', 'tipe_kendaraan kapasitas nomor_plat status');

    res.json({
      success: true,
      message: 'Jadwal updated successfully',
      data: {
        jadwal: updatedJadwal
      }
    });
  } catch (error) {
    console.error('Update jadwal error:', error);
    
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
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid jadwal ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating jadwal'
    });
  }
};

// @desc    Delete jadwal (Admin only)
// @route   DELETE /api/admin/jadwal/:id
// @access  Public (for now, would be admin only in production)
const deleteJadwal = async (req, res) => {
  try {
    const jadwalId = req.params.id;

    const jadwal = await Jadwal.findById(jadwalId);
    if (!jadwal) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal not found'
      });
    }

    await Jadwal.findByIdAndDelete(jadwalId);

    res.json({
      success: true,
      message: 'Jadwal deleted successfully'
    });
  } catch (error) {
    console.error('Delete jadwal error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid jadwal ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while deleting jadwal'
    });
  }
};

module.exports = {
  getAllJadwal,
  getJadwalById,
  createJadwal,
  updateJadwal,
  deleteJadwal
};