const mongoose = require("mongoose");

const ruteSchema = new mongoose.Schema({
  lokasi_keberangkatan: {
    type: String,
    required: true,
    trim: true
  },
  lokasi_tujuan: {
    type: String,
    required: true,
    trim: true
  },
  tanggal_keberangkatan: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Rute", ruteSchema, "rute");