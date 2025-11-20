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
  },
  
  // Peta kursi dengan status
  peta_kursi: [{
    nomor_kursi: {
      type: String,
      required: true
    },
    status_kursi: {
      type: String,
      enum: ['TERSEDIA', 'TERPESAN', 'TIDAK_TERSEDIA'],
      default: 'TERSEDIA'
    },
    pemesanan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pemesanan'
    }
  }]
}, {
  timestamps: true
});

// Pre-save middleware untuk set kursi_tersedia dari kapasitas armada dan generate peta kursi
jadwalSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const armada = await mongoose.model('Armada').findById(this.armada_id);
      if (armada) {
        this.kursi_tersedia = armada.kapasitas;
        
        // Generate peta kursi berdasarkan tipe kendaraan
        const petaKursi = [];
        const kapasitas = armada.kapasitas;
        
        if (armada.tipe_kendaraan === 'BUS') {
          // Layout BUS: 4 kursi per baris (2-2), dengan nomor A1, A2, B1, B2, dst
          const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
          let kursiIndex = 1;
          
          for (let i = 0; i < Math.ceil(kapasitas / 4); i++) {
            for (let j = 1; j <= 4 && kursiIndex <= kapasitas; j++) {
              petaKursi.push({
                nomor_kursi: `${rows[i]}${j}`,
                status_kursi: 'TERSEDIA'
              });
              kursiIndex++;
            }
          }
        } else if (armada.tipe_kendaraan === 'MINI_BUS') {
          // Layout MINI_BUS: 3 kursi per baris, dengan nomor 1, 2, 3, dst
          for (let i = 1; i <= kapasitas; i++) {
            petaKursi.push({
              nomor_kursi: i.toString(),
              status_kursi: 'TERSEDIA'
            });
          }
        } else {
          // Layout default: nomor berurutan
          for (let i = 1; i <= kapasitas; i++) {
            petaKursi.push({
              nomor_kursi: i.toString(),
              status_kursi: 'TERSEDIA'
            });
          }
        }
        
        this.peta_kursi = petaKursi;
      }
    } catch (error) {
      console.error('Error setting kursi_tersedia and peta_kursi:', error);
    }
  }
  next();
});

// Method untuk mengecek ketersediaan kursi
jadwalSchema.methods.isSeatAvailable = function(nomorKursi) {
  const kursi = this.peta_kursi.find(k => k.nomor_kursi === nomorKursi);
  return kursi && kursi.status_kursi === 'TERSEDIA';
};

// Method untuk memesan kursi
jadwalSchema.methods.bookSeats = function(nomorKursiArray, pemesananId) {
  nomorKursiArray.forEach(nomorKursi => {
    const kursi = this.peta_kursi.find(k => k.nomor_kursi === nomorKursi);
    if (kursi && kursi.status_kursi === 'TERSEDIA') {
      kursi.status_kursi = 'TERPESAN';
      kursi.pemesanan_id = pemesananId;
      this.kursi_tersedia--;
    }
  });
};

// Method untuk membatalkan kursi
jadwalSchema.methods.releaseSeats = function(nomorKursiArray) {
  nomorKursiArray.forEach(nomorKursi => {
    const kursi = this.peta_kursi.find(k => k.nomor_kursi === nomorKursi);
    if (kursi && kursi.status_kursi === 'TERPESAN') {
      kursi.status_kursi = 'TERSEDIA';
      kursi.pemesanan_id = undefined;
      this.kursi_tersedia++;
    }
  });
};

// Method untuk mendapatkan kursi yang tersedia
jadwalSchema.methods.getAvailableSeats = function() {
  return this.peta_kursi
    .filter(k => k.status_kursi === 'TERSEDIA')
    .map(k => k.nomor_kursi);
};

// Index untuk optimasi query
jadwalSchema.index({ waktu_keberangkatan: 1 });
jadwalSchema.index({ rute_id: 1, waktu_keberangkatan: 1 });
jadwalSchema.index({ status_jadwal: 1 });
jadwalSchema.index({ 'peta_kursi.pemesanan_id': 1 });

module.exports = mongoose.model("Jadwal", jadwalSchema, "jadwal");