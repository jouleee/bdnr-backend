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

// 📊 AGREGASI + 🔄 SORTING: Pre-save middleware untuk generate peta kursi dengan layout terurut
// Set kursi_tersedia dari kapasitas armada dan generate peta kursi berdasarkan tipe kendaraan
jadwalSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const armada = await mongoose.model('Armada').findById(this.armada_id);
      if (armada) {
        this.kursi_tersedia = armada.kapasitas;  // 📊 AGREGASI: Set initial available seat count
        
        // 📊 AGREGASI + 🔄 SORTING: Generate peta kursi berdasarkan tipe kendaraan
        const petaKursi = [];
        const kapasitas = armada.kapasitas;
        
        if (armada.tipe_kendaraan === 'BUS') {
          // 🔄 SORTING: Layout BUS dengan urutan A1, A2, B1, B2, dst (4 kursi per baris)
          // 📊 AGREGASI: Calculate total rows needed
          const numRows = Math.ceil(kapasitas / 4);  // 📊 AGREGASI: Math calculation
          // 🔄 SORTING: Generate alphabetical row letters (A, B, C... AA, AB, AC...)
          const rows = [];
          for (let i = 0; i < numRows; i++) {
            if (i < 26) {
              // 🔄 SORTING: A-Z sequence
              rows.push(String.fromCharCode(65 + i));
            } else {
              // 🔄 SORTING: AA, AB, AC... sequence untuk bus besar
              const firstLetter = String.fromCharCode(65 + Math.floor(i / 26) - 1);
              const secondLetter = String.fromCharCode(65 + (i % 26));
              rows.push(firstLetter + secondLetter);
            }
          }
          
          // 🔄 SORTING: Generate seats dalam urutan A1, A2, A3, A4, B1, B2, B3, B4...
          let kursiIndex = 1;
          for (let i = 0; i < numRows; i++) {
            for (let j = 1; j <= 4 && kursiIndex <= kapasitas; j++) {
              petaKursi.push({
                nomor_kursi: `${rows[i]}${j}`,  // 🔄 SORTING: Format A1, A2, B1, B2
                status_kursi: 'TERSEDIA'
              });
              kursiIndex++;
            }
          }
        } else if (armada.tipe_kendaraan === 'MINI_BUS') {
          // 🔄 SORTING: Layout MINI_BUS dengan urutan numerik 1, 2, 3, dst
          for (let i = 1; i <= kapasitas; i++) {
            petaKursi.push({
              nomor_kursi: i.toString(),  // 🔄 SORTING: Sequential numbering
              status_kursi: 'TERSEDIA'
            });
          }
        } else {
          // 🔄 SORTING: Layout default dengan nomor berurutan 1, 2, 3...
          for (let i = 1; i <= kapasitas; i++) {
            petaKursi.push({
              nomor_kursi: i.toString(),  // 🔄 SORTING: Sequential numbering
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

// 📊 AGREGASI: Method untuk mengecek ketersediaan kursi spesifik
// Filter dari array peta_kursi untuk cek status kursi tertentu
jadwalSchema.methods.isSeatAvailable = function(nomorKursi) {
  const kursi = this.peta_kursi.find(k => k.nomor_kursi === nomorKursi);  // 📊 AGREGASI: Find specific seat
  return kursi && kursi.status_kursi === 'TERSEDIA';
};

// 📊 AGREGASI: Method untuk memesan kursi dan update counter
// Update status kursi + decrement kursi_tersedia counter
jadwalSchema.methods.bookSeats = function(nomorKursiArray, pemesananId) {
  nomorKursiArray.forEach(nomorKursi => {
    const kursi = this.peta_kursi.find(k => k.nomor_kursi === nomorKursi);  // 📊 AGREGASI: Find seat
    if (kursi && kursi.status_kursi === 'TERSEDIA') {
      kursi.status_kursi = 'TERPESAN';
      kursi.pemesanan_id = pemesananId;
      this.kursi_tersedia--;  // 📊 AGREGASI: Decrement available seat counter
    }
  });
};

// 📊 AGREGASI: Method untuk membatalkan kursi dan update counter
// Update status kursi + increment kursi_tersedia counter
jadwalSchema.methods.releaseSeats = function(nomorKursiArray) {
  nomorKursiArray.forEach(nomorKursi => {
    const kursi = this.peta_kursi.find(k => k.nomor_kursi === nomorKursi);  // 📊 AGREGASI: Find seat
    if (kursi && kursi.status_kursi === 'TERPESAN') {
      kursi.status_kursi = 'TERSEDIA';
      kursi.pemesanan_id = undefined;
      this.kursi_tersedia++;  // 📊 AGREGASI: Increment available seat counter
    }
  });
};

// 📊 AGREGASI: Method untuk mendapatkan daftar kursi yang tersedia
// Filter array peta_kursi + transform ke array nomor kursi saja
jadwalSchema.methods.getAvailableSeats = function() {
  return this.peta_kursi
    .filter(k => k.status_kursi === 'TERSEDIA')  // 📊 AGREGASI: Filter kursi tersedia
    .map(k => k.nomor_kursi);                    // 📊 AGREGASI: Transform ke array nomor kursi
};

// Index untuk optimasi query
jadwalSchema.index({ waktu_keberangkatan: 1 });
jadwalSchema.index({ rute_id: 1, waktu_keberangkatan: 1 });
jadwalSchema.index({ 'peta_kursi.pemesanan_id': 1 });

module.exports = mongoose.model("Jadwal", jadwalSchema, "jadwal");