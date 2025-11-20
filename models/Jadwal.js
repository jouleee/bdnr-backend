const mongoose = require("mongoose");

const jadwalSchema = new mongoose.Schema({
  rute_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rute',
    required: true
  },
  armada_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Armada',
    required: true
  },
  waktu_keberangkatan: {
    type: Date,
    required: true
  },
  estimasi_waktu_perjalanan: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/ // Format HH:MM:SS
  },
  harga_dasar: {
    type: Number,
    required: true,
    min: 0
  },
  status_jadwal: {
    type: String,
    enum: ['AKTIF', 'BATAL', 'SELESAI', 'DELAY'],
    default: 'AKTIF'
  },
  kursi_tersedia: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

// Pre-save middleware untuk set kursi_tersedia dari kapasitas armada
jadwalSchema.pre('save', async function(next) {
  if (this.isNew && !this.kursi_tersedia) {
    try {
      const armada = await mongoose.model('Armada').findById(this.armada_id);
      if (armada) {
        this.kursi_tersedia = armada.kapasitas;
      }
    } catch (error) {
      console.error('Error setting kursi_tersedia:', error);
    }
  }
  next();
});

// Index untuk optimasi query
jadwalSchema.index({ waktu_keberangkatan: 1 });
jadwalSchema.index({ rute_id: 1, waktu_keberangkatan: 1 });
jadwalSchema.index({ status_jadwal: 1 });

module.exports = mongoose.model("Jadwal", jadwalSchema, "jadwal");