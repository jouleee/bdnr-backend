// Migration script untuk menambahkan jadwal_snapshot ke pemesanan yang sudah ada
// Jalankan script ini untuk mengupdate pemesanan lama agar memiliki jadwal_snapshot

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Pemesanan = require('../models/Pemesanan');
const Jadwal = require('../models/Jadwal');
const Rute = require('../models/Rute');
const Armada = require('../models/Armada');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bismillah');

const migrateJadwalSnapshot = async () => {
  try {
    console.log('🔄 Starting jadwal_snapshot migration...');
    
    // Cari semua pemesanan yang belum memiliki jadwal_snapshot
    const pemesanansWithoutSnapshot = await Pemesanan.find({
      jadwal_snapshot: { $exists: false }
    }).populate({
      path: 'jadwal_id',
      populate: [
        { path: 'rute_id' },
        { path: 'armada_id' }
      ]
    });

    console.log(`📋 Found ${pemesanansWithoutSnapshot.length} pemesanan without jadwal_snapshot`);
    
    let migratedCount = 0;
    let skippedCount = 0;

    for (const pemesanan of pemesanansWithoutSnapshot) {
      if (!pemesanan.jadwal_id) {
        console.log(`⚠️ Skipping pemesanan ${pemesanan.kode_booking} - jadwal already deleted`);
        skippedCount++;
        continue;
      }

      const jadwal = pemesanan.jadwal_id;
      
      // Create jadwal_snapshot
      const jadwalSnapshot = {
        jadwal_id: jadwal._id,
        waktu_keberangkatan: jadwal.waktu_keberangkatan,
        estimasi_waktu_perjalanan: jadwal.estimasi_waktu_perjalanan,
        harga_dasar: jadwal.harga_dasar,
        rute: {
          rute_id: jadwal.rute_id._id,
          lokasi_keberangkatan: jadwal.rute_id.lokasi_keberangkatan,
          lokasi_tujuan: jadwal.rute_id.lokasi_tujuan
        },
        armada: {
          armada_id: jadwal.armada_id._id,
          tipe_kendaraan: jadwal.armada_id.tipe_kendaraan,
          kapasitas: jadwal.armada_id.kapasitas
        }
      };

      // Update pemesanan dengan jadwal_snapshot
      await Pemesanan.findByIdAndUpdate(
        pemesanan._id,
        { jadwal_snapshot: jadwalSnapshot },
        { new: true }
      );

      console.log(`✅ Migrated pemesanan ${pemesanan.kode_booking}`);
      migratedCount++;
    }

    console.log('🎉 Migration completed!');
    console.log(`✅ Successfully migrated: ${migratedCount} pemesanan`);
    console.log(`⚠️ Skipped (jadwal deleted): ${skippedCount} pemesanan`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
if (require.main === module) {
  migrateJadwalSnapshot();
}

module.exports = migrateJadwalSnapshot;