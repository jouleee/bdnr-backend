const mongoose = require("mongoose");

const armadaSchema = new mongoose.Schema({
  tipe_kendaraan: {
    type: String,
    required: true,
    enum: ['BUS', 'MINI_BUS', 'TRAVEL', 'KERETA'],
    trim: true
  },
  kapasitas: {
    type: Number,
    required: true,
    min: 1
  },
  nomor_plat: {
    type: String,
    trim: true,
    sparse: true // Allow multiple null values
  },
  status: {
    type: String,
    enum: ['AKTIF', 'MAINTENANCE', 'NONAKTIF'],
    default: 'AKTIF'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Armada", armadaSchema, "armada");