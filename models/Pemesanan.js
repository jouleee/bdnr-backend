const mongoose = require("mongoose");

// Schema untuk data penumpang individual
const penumpangSchema = new mongoose.Schema({
  nama_lengkap: {
    type: String,
    required: true,
    trim: true
  },
  tipe_identitas: {
    type: String,
    enum: ['KTP', 'SIM', 'PASPOR', 'KARTU_PELAJAR'],
    required: true
  },
  nomor_identitas: {
    type: String,
    required: true,
    trim: true
  },
  tanggal_lahir: {
    type: Date,
    required: true
  },
  jenis_kelamin: {
    type: String,
    enum: ['L', 'P'],
    required: true
  },
  nomor_telepon: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  nomor_kursi: {
    type: String,
    required: true,
    trim: true
  },
  status_check_in: {
    type: String,
    enum: ['BELUM_CHECK_IN', 'SUDAH_CHECK_IN', 'BOARDING'],
    default: 'BELUM_CHECK_IN'
  }
}, { _id: true });

const pemesananSchema = new mongoose.Schema({
  // User yang melakukan pemesanan (bisa berbeda dengan penumpang)
  user_pemesan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Jadwal yang dipilih
  jadwal_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Jadwal',
    required: true
  },
  
  // Kode booking unik
  kode_booking: {
    type: String,
    unique: true,
    required: true
  },
  
  // Data kontak untuk konfirmasi
  kontak_darurat: {
    nama: {
      type: String,
      required: true,
      trim: true
    },
    nomor_telepon: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    }
  },
  
  // Daftar penumpang (bisa lebih dari 1)
  daftar_penumpang: [penumpangSchema],
  
  // Informasi harga
  harga_per_tiket: {
    type: Number,
    required: true,
    min: 0
  },
  jumlah_penumpang: {
    type: Number,
    required: true,
    min: 1,
    max: 6 // Maksimal 6 penumpang per booking
  },
  total_harga: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Status pemesanan
  status_pemesanan: {
    type: String,
    enum: ['MENUNGGU_PEMBAYARAN', 'LUNAS', 'DIBATALKAN', 'EXPIRED', 'REFUND'],
    default: 'MENUNGGU_PEMBAYARAN'
  },
  
  // Waktu pemesanan dan batas pembayaran
  waktu_pemesanan: {
    type: Date,
    default: Date.now
  },
  batas_waktu_pembayaran: {
    type: Date,
    required: true
  },
  
  // Data pembayaran
  pembayaran: {
    metode_pembayaran: {
      type: String,
      enum: ['TRANSFER_BANK', 'QRIS', 'EWALLET', 'CREDIT_CARD', 'CASH']
    },
    referensi_pembayaran: {
      type: String,
      trim: true
    },
    waktu_pembayaran: {
      type: Date
    },
    jumlah_bayar: {
      type: Number,
      min: 0
    }
  },
  
  // Catatan tambahan
  catatan: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Generate kode booking unik
pemesananSchema.pre('validate', function(next) {
  // Generate kode_booking if not exists
  if (!this.kode_booking) {
    const timestamp = Date.now().toString().slice(-8);
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.kode_booking = `TRV${timestamp}${randomStr}`;
  }
  
  // Set batas_waktu_pembayaran if not exists (24 hours from now)
  if (!this.batas_waktu_pembayaran) {
    this.batas_waktu_pembayaran = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Method untuk mengecek apakah pembayaran sudah expired
pemesananSchema.methods.isExpired = function() {
  return new Date() > this.batas_waktu_pembayaran && this.status_pemesanan === 'MENUNGGU_PEMBAYARAN';
};

// Method untuk menghitung total harga
pemesananSchema.methods.calculateTotalPrice = function() {
  return this.harga_per_tiket * this.jumlah_penumpang;
};

// Virtual untuk mendapatkan kursi yang dipesan
pemesananSchema.virtual('kursi_dipesan').get(function() {
  return this.daftar_penumpang.map(p => p.nomor_kursi);
});

// Index untuk optimasi query
// pemesananSchema.index({ kode_booking: 1 }); // Already unique in schema
pemesananSchema.index({ user_pemesan_id: 1, waktu_pemesanan: -1 });
pemesananSchema.index({ jadwal_id: 1 });
pemesananSchema.index({ status_pemesanan: 1 });
pemesananSchema.index({ batas_waktu_pembayaran: 1 });

module.exports = mongoose.model("Pemesanan", pemesananSchema, "pemesanan");