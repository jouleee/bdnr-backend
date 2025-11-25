// Script untuk mengecek jadwal_snapshot di database
const mongoose = require('mongoose');
require('dotenv').config();

const Pemesanan = require('./models/Pemesanan');
const Jadwal = require('./models/Jadwal');
const Rute = require('./models/Rute');
const Armada = require('./models/Armada');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bismillah');

const checkJadwalSnapshot = async () => {
  try {
    console.log('🔍 Checking jadwal_snapshot status in database...\n');
    
    // 1. Check specific pemesanan from screenshot
    const pemesanan1 = await Pemesanan.findOne({ kode_booking: 'TRV3530521130Z' });
    console.log('📋 TRV3530521130Z (from screenshot):');
    console.log('   Exists:', !!pemesanan1);
    console.log('   Has jadwal_snapshot:', !!pemesanan1?.jadwal_snapshot);
    console.log('   jadwal_id exists:', !!pemesanan1?.jadwal_id);
    if (pemesanan1?.jadwal_snapshot) {
      console.log('   Snapshot rute:', pemesanan1.jadwal_snapshot.rute.lokasi_keberangkatan, '→', pemesanan1.jadwal_snapshot.rute.lokasi_tujuan);
      console.log('   Snapshot harga:', pemesanan1.jadwal_snapshot.harga_dasar);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // 2. Check all pemesanan with jadwal_snapshot
    const withSnapshot = await Pemesanan.find({ jadwal_snapshot: { $exists: true } });
    console.log(`\n📊 Total pemesanan WITH jadwal_snapshot: ${withSnapshot.length}`);
    if (withSnapshot.length > 0) {
      console.log('   List:');
      withSnapshot.forEach(p => {
        console.log(`   - ${p.kode_booking}: ${p.jadwal_snapshot?.rute?.lokasi_keberangkatan} → ${p.jadwal_snapshot?.rute?.lokasi_tujuan}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    // 3. Check all pemesanan WITHOUT jadwal_snapshot
    const withoutSnapshot = await Pemesanan.find({ jadwal_snapshot: { $exists: false } });
    console.log(`\n❌ Total pemesanan WITHOUT jadwal_snapshot: ${withoutSnapshot.length}`);
    if (withoutSnapshot.length > 0) {
      console.log('   List (first 10):');
      withoutSnapshot.slice(0, 10).forEach(p => {
        console.log(`   - ${p.kode_booking} | Created: ${p.createdAt?.toISOString()?.slice(0,19)}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    // 4. Check recent pemesanan (newest 5)
    const recentPemesanan = await Pemesanan.find().sort({ createdAt: -1 }).limit(5);
    console.log('\n📅 5 Most recent pemesanan:');
    for (const p of recentPemesanan) {
      console.log(`   - ${p.kode_booking} | Created: ${p.createdAt?.toISOString()?.slice(0,19)} | Has snapshot: ${!!p.jadwal_snapshot}`);
      if (p.jadwal_snapshot) {
        console.log(`     └─ ${p.jadwal_snapshot.rute.lokasi_keberangkatan} → ${p.jadwal_snapshot.rute.lokasi_tujuan}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    // 5. Statistics
    const totalPemesanan = await Pemesanan.countDocuments();
    const snapshotCount = withSnapshot.length;
    const noSnapshotCount = withoutSnapshot.length;
    
    console.log('\n📊 STATISTICS:');
    console.log(`   Total Pemesanan: ${totalPemesanan}`);
    console.log(`   With jadwal_snapshot: ${snapshotCount} (${Math.round(snapshotCount/totalPemesanan*100)}%)`);
    console.log(`   Without jadwal_snapshot: ${noSnapshotCount} (${Math.round(noSnapshotCount/totalPemesanan*100)}%)`);
    
    console.log('\n💡 RECOMMENDATION:');
    if (noSnapshotCount > 0) {
      console.log('   Run migration again to add jadwal_snapshot to remaining pemesanan');
      console.log('   Command: npm run migrate:jadwal-snapshot');
    } else {
      console.log('   All pemesanan have jadwal_snapshot! ✅');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking jadwal_snapshot:', error);
    process.exit(1);
  }
};

checkJadwalSnapshot();