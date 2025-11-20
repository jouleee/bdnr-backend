const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/database');

// Import all seeders
const seedRute = require('./ruteSeeder');
const seedArmada = require('./armadaSeeder');
const seedJadwal = require('./jadwalSeeder');

const runAllSeeders = async () => {
  try {
    console.log('🚀 Starting database seeding process...\n');

    // Connect to database first
    await connectDB();
    console.log('📊 Database connected successfully\n');

    // Run seeders in order (rute and armada first, then jadwal)
    console.log('1️⃣ Seeding Rute data...');
    await seedRute();
    console.log('✅ Rute seeding completed\n');

    console.log('2️⃣ Seeding Armada data...');
    await seedArmada();
    console.log('✅ Armada seeding completed\n');

    console.log('3️⃣ Seeding Jadwal data...');
    await seedJadwal();
    console.log('✅ Jadwal seeding completed\n');

    console.log('🎉 All seeders completed successfully!');
    
    // Display summary
    const Rute = require('../models/Rute');
    const Armada = require('../models/Armada');
    const Jadwal = require('../models/Jadwal');
    
    const ruteCount = await Rute.countDocuments();
    const armadaCount = await Armada.countDocuments();
    const jadwalCount = await Jadwal.countDocuments();
    
    console.log('\n📊 Database Summary:');
    console.log(`   Routes: ${ruteCount}`);
    console.log(`   Vehicles: ${armadaCount}`);
    console.log(`   Schedules: ${jadwalCount}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    mongoose.connection.close();
  }
};

// Run if called directly
if (require.main === module) {
  runAllSeeders()
    .then(() => {
      console.log('✅ All seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllSeeders,
  seedRute,
  seedArmada,
  seedJadwal
};