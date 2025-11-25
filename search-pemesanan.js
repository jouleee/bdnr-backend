const mongoose = require('mongoose');
require('dotenv').config();
const Pemesanan = require('./models/Pemesanan');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bismillah');

const searchPemesanan = async () => {
  try {
    console.log('🔍 Searching for pemesanan...\n');
    
    // Look for similar booking codes to screenshot
    const pemesanans = await Pemesanan.find({ 
      kode_booking: { $regex: 'TRV353', $options: 'i' } 
    });
    console.log('📋 Pemesanan dengan kode TRV353*:');
    pemesanans.forEach(p => {
      console.log(`  - ${p.kode_booking} | Created: ${p.createdAt?.toISOString()?.slice(0,19)} | Has snapshot: ${!!p.jadwal_snapshot}`);
    });
    
    // Also check for exact match from screenshot
    const exact = await Pemesanan.findOne({ kode_booking: 'TRV3530521130Z' });
    console.log(`\n📋 TRV3530521130Z exact match: ${!!exact}`);
    
    // Check all booking codes starting with TRV35
    const trv35 = await Pemesanan.find({ 
      kode_booking: { $regex: '^TRV35', $options: 'i' } 
    });
    console.log('\n📋 All pemesanan starting with TRV35:');
    trv35.forEach(p => {
      console.log(`  - ${p.kode_booking} | Created: ${p.createdAt?.toISOString()?.slice(0,19)} | Has snapshot: ${!!p.jadwal_snapshot}`);
    });
    
    // Let's also check the specific ObjectId from screenshot
    const byId = await Pemesanan.findById('69250ae9d575a606c8095d27');
    console.log('\n📋 Pemesanan by ObjectId (69250ae9d575a606c8095d27):');
    if (byId) {
      console.log(`  - ${byId.kode_booking} | Created: ${byId.createdAt?.toISOString()?.slice(0,19)} | Has snapshot: ${!!byId.jadwal_snapshot}`);
    } else {
      console.log('  Not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

searchPemesanan();