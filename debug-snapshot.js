// Debug script untuk melihat detail jadwal_snapshot
const mongoose = require('mongoose');
require('dotenv').config();

const Pemesanan = require('./models/Pemesanan');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bismillah');

const debugSnapshot = async () => {
  try {
    console.log('🔍 Debug jadwal_snapshot content...\n');
    
    // Get all pemesanan with jadwal_snapshot
    const withSnapshot = await Pemesanan.find({ jadwal_snapshot: { $exists: true } });
    
    console.log(`📋 Found ${withSnapshot.length} pemesanan with jadwal_snapshot:`);
    
    withSnapshot.forEach((p, index) => {
      console.log(`\n${index + 1}. ${p.kode_booking}:`);
      console.log('   jadwal_snapshot exists:', !!p.jadwal_snapshot);
      console.log('   jadwal_snapshot keys:', Object.keys(p.jadwal_snapshot || {}));
      
      if (p.jadwal_snapshot) {
        console.log('   rute object:', JSON.stringify(p.jadwal_snapshot.rute || {}, null, 4));
        console.log('   rute keys:', Object.keys(p.jadwal_snapshot.rute || {}));
        console.log('   armada object:', JSON.stringify(p.jadwal_snapshot.armada || {}, null, 4));
        console.log('   armada keys:', Object.keys(p.jadwal_snapshot.armada || {}));
        
        // Check if broken
        const isBroken = !p.jadwal_snapshot?.rute?.lokasi_keberangkatan || 
                        !p.jadwal_snapshot?.rute?.lokasi_tujuan ||
                        !p.jadwal_snapshot?.armada?.tipe_kendaraan ||
                        Object.keys(p.jadwal_snapshot.rute || {}).length === 0 ||
                        Object.keys(p.jadwal_snapshot.armada || {}).length === 0;
        
        console.log('   IS BROKEN:', isBroken);
        
        if (p.kode_booking === 'TRV35305211JOZ') {
          console.log('   🎯 THIS IS THE PROBLEMATIC ONE FROM SCREENSHOT!');
          console.log('   Full jadwal_snapshot:', JSON.stringify(p.jadwal_snapshot, null, 4));
        }
      }
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
};

debugSnapshot();