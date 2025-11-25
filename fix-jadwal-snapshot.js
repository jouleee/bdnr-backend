// Script untuk memperbaiki jadwal_snapshot yang kosong/rusak
const mongoose = require('mongoose');
require('dotenv').config();

const Pemesanan = require('./models/Pemesanan');
const Jadwal = require('./models/Jadwal');
const Rute = require('./models/Rute');
const Armada = require('./models/Armada');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bismillah');

const fixBrokenSnapshots = async () => {
  try {
    console.log('🔧 Fixing broken jadwal_snapshot data...\n');
    
    // Find pemesanan with empty/broken jadwal_snapshot - more comprehensive query
    const brokenSnapshots = await Pemesanan.find({
      jadwal_snapshot: { $exists: true }
    }).populate({
      path: 'jadwal_id',
      populate: [
        { path: 'rute_id' },
        { path: 'armada_id' }
      ]
    });
    
    // Filter broken snapshots in code since MongoDB query might not catch all cases
    const actuallyBroken = brokenSnapshots.filter(p => {
      const snapshot = p.jadwal_snapshot;
      // Check if rute data is missing/empty
      const ruteEmpty = !snapshot?.rute?.lokasi_keberangkatan || 
                       !snapshot?.rute?.lokasi_tujuan ||
                       snapshot.rute?.lokasi_keberangkatan === '' ||
                       snapshot.rute?.lokasi_tujuan === '';
      
      // Check if armada data is missing/empty  
      const armadaEmpty = !snapshot?.armada?.tipe_kendaraan ||
                         snapshot.armada?.tipe_kendaraan === '';
                         
      return ruteEmpty || armadaEmpty;
    });
    
    console.log(`📋 Found ${brokenSnapshots.length} total pemesanan with jadwal_snapshot`);
    console.log(`🔧 Found ${actuallyBroken.length} pemesanan with broken jadwal_snapshot`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const pemesanan of actuallyBroken) {
      console.log(`\n🔧 Fixing ${pemesanan.kode_booking}...`);
      
      if (!pemesanan.jadwal_id) {
        console.log(`   ⚠️ Skip - jadwal_id not found (deleted)`);
        skippedCount++;
        continue;
      }
      
      const jadwal = pemesanan.jadwal_id;
      
      if (!jadwal.rute_id || !jadwal.armada_id) {
        console.log(`   ⚠️ Skip - jadwal missing rute_id or armada_id`);
        skippedCount++;
        continue;
      }
      
      // Create proper jadwal_snapshot
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
      
      // Update the pemesanan
      await Pemesanan.findByIdAndUpdate(
        pemesanan._id,
        { jadwal_snapshot: jadwalSnapshot },
        { new: true }
      );
      
      console.log(`   ✅ Fixed: ${jadwalSnapshot.rute.lokasi_keberangkatan} → ${jadwalSnapshot.rute.lokasi_tujuan}`);
      fixedCount++;
    }
    
    console.log('\n🎉 Fix completed!');
    console.log(`✅ Successfully fixed: ${fixedCount} pemesanan`);
    console.log(`⚠️ Skipped: ${skippedCount} pemesanan`);
    
    // Verify the fix
    console.log('\n📋 Verifying fixes...');
    const verifyPemesanan = await Pemesanan.findOne({ kode_booking: 'TRV35305211JOZ' });
    if (verifyPemesanan?.jadwal_snapshot?.rute?.lokasi_keberangkatan) {
      console.log(`✅ TRV35305211JOZ now has: ${verifyPemesanan.jadwal_snapshot.rute.lokasi_keberangkatan} → ${verifyPemesanan.jadwal_snapshot.rute.lokasi_tujuan}`);
    } else {
      console.log('❌ TRV35305211JOZ still broken');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
};

fixBrokenSnapshots();