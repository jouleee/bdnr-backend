// Check database status after seeding
const mongoose = require('mongoose');
require('dotenv').config();

const Pemesanan = require('./models/Pemesanan');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bismillah');

const checkAfterSeeding = async () => {
  try {
    console.log('🔄 Checking database status after seeding...\n');
    
    // Check total pemesanan count
    const totalPemesanan = await Pemesanan.countDocuments();
    console.log('📊 Total pemesanan after seeding:', totalPemesanan);
    
    // Check pemesanan with jadwal_snapshot
    const withSnapshot = await Pemesanan.countDocuments({ jadwal_snapshot: { $exists: true } });
    console.log('📊 Pemesanan with jadwal_snapshot:', withSnapshot);
    
    // Check all pemesanan
    const allPemesanan = await Pemesanan.find().sort({ createdAt: -1 });
    console.log('\n📅 All pemesanan (after seeding):');
    allPemesanan.forEach((p, index) => {
      console.log(`  ${index + 1}. ${p.kode_booking} | Created: ${p.createdAt?.toISOString()?.slice(0,19)} | Has snapshot: ${!!p.jadwal_snapshot}`);
    });
    
    if (totalPemesanan === 0) {
      console.log('\n💡 DATABASE IS CLEAN AFTER SEEDING!');
      console.log('✅ Perfect! Now let\'s test creating new pemesanan with jadwal_snapshot');
      console.log('\nNext steps:');
      console.log('1. 🔄 Start backend server: npm run dev');
      console.log('2. 🌐 Start frontend: npm run dev');
      console.log('3. 📝 Create new booking through frontend');
      console.log('4. ✅ Verify jadwal_snapshot is saved correctly');
    } else {
      console.log('\n📋 EXISTING DATA FOUND');
      console.log('Some pemesanan still exist, which means seeding might not have cleared everything');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
};

checkAfterSeeding();