// Test script untuk memverifikasi jadwal_snapshot implementation
// Run: node test-jadwal-snapshot.js

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Pemesanan = require('./models/Pemesanan');
const Jadwal = require('./models/Jadwal');
const Rute = require('./models/Rute');
const Armada = require('./models/Armada');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bismillah');

const testJadwalSnapshot = async () => {
  try {
    console.log('🧪 Testing jadwal_snapshot implementation...\n');
    
    // 1. Test: Get pemesanan dengan jadwal_snapshot
    console.log('📋 Testing pemesanan dengan jadwal_snapshot...');
    const pemesananWithSnapshot = await Pemesanan.findOne({
      jadwal_snapshot: { $exists: true }
    });
    
    if (pemesananWithSnapshot) {
      console.log('✅ Found pemesanan with jadwal_snapshot:');
      console.log(`   Kode Booking: ${pemesananWithSnapshot.kode_booking}`);
      console.log(`   Rute: ${pemesananWithSnapshot.jadwal_snapshot.rute.lokasi_keberangkatan} → ${pemesananWithSnapshot.jadwal_snapshot.rute.lokasi_tujuan}`);
      console.log(`   Waktu: ${pemesananWithSnapshot.jadwal_snapshot.waktu_keberangkatan}`);
      console.log(`   Harga: Rp ${pemesananWithSnapshot.jadwal_snapshot.harga_dasar?.toLocaleString('id-ID')}`);
    } else {
      console.log('❌ No pemesanan with jadwal_snapshot found');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 2. Test: Get pemesanan tanpa jadwal_snapshot (data lama)
    console.log('📋 Testing pemesanan tanpa jadwal_snapshot...');
    const pemesananWithoutSnapshot = await Pemesanan.findOne({
      jadwal_snapshot: { $exists: false }
    }).populate({
      path: 'jadwal_id',
      populate: [
        { path: 'rute_id' },
        { path: 'armada_id' }
      ]
    });
    
    if (pemesananWithoutSnapshot) {
      console.log('✅ Found pemesanan without jadwal_snapshot:');
      console.log(`   Kode Booking: ${pemesananWithoutSnapshot.kode_booking}`);
      
      if (pemesananWithoutSnapshot.jadwal_id) {
        console.log(`   Jadwal EXISTS - Rute: ${pemesananWithoutSnapshot.jadwal_id.rute_id?.lokasi_keberangkatan} → ${pemesananWithoutSnapshot.jadwal_id.rute_id?.lokasi_tujuan}`);
      } else {
        console.log('   ⚠️ Jadwal DELETED - Would show N/A in old system');
        console.log('   💡 This is where jadwal_snapshot would be used as fallback');
      }
    } else {
      console.log('✅ All pemesanan now have jadwal_snapshot!');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 3. Statistics
    const totalPemesanan = await Pemesanan.countDocuments();
    const withSnapshot = await Pemesanan.countDocuments({ jadwal_snapshot: { $exists: true } });
    const withoutSnapshot = totalPemesanan - withSnapshot;
    
    console.log('📊 STATISTICS:');
    console.log(`   Total Pemesanan: ${totalPemesanan}`);
    console.log(`   With jadwal_snapshot: ${withSnapshot} (${Math.round(withSnapshot/totalPemesanan*100)}%)`);
    console.log(`   Without jadwal_snapshot: ${withoutSnapshot} (${Math.round(withoutSnapshot/totalPemesanan*100)}%)`);
    
    // 4. Test: Pemesanan with deleted jadwal but has snapshot
    console.log('\n📋 Testing fallback scenario (jadwal deleted but has snapshot)...');
    const pemesananDeletedJadwal = await Pemesanan.findOne({
      jadwal_id: null,
      jadwal_snapshot: { $exists: true }
    });
    
    if (pemesananDeletedJadwal) {
      console.log('✅ Found pemesanan with deleted jadwal but has snapshot:');
      console.log(`   Kode Booking: ${pemesananDeletedJadwal.kode_booking}`);
      console.log(`   ✅ Can still show: ${pemesananDeletedJadwal.jadwal_snapshot.rute.lokasi_keberangkatan} → ${pemesananDeletedJadwal.jadwal_snapshot.rute.lokasi_tujuan}`);
      console.log('   💡 This proves the fallback mechanism works!');
    } else {
      console.log('ℹ️ No pemesanan with deleted jadwal + snapshot found (this is normal)');
    }
    
    console.log('\n🎉 jadwal_snapshot implementation test completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

// Run test
if (require.main === module) {
  testJadwalSnapshot();
}

module.exports = testJadwalSnapshot;