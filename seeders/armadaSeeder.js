const mongoose = require('mongoose');
const Armada = require('../models/Armada');

const seedArmada = async () => {
  try {
    console.log('🌱 Starting armada seeding...');

    // Clear existing armada data
    await Armada.deleteMany({});
    console.log('✅ Cleared existing armada data');

    // Sample armada data
    const armadaData = [
      {
        tipe_kendaraan: 'BUS',
        kapasitas: 40,
        nomor_plat: 'B 1234 ABC',
        status: 'AKTIF'
      },
      {
        tipe_kendaraan: 'BUS',
        kapasitas: 40,
        nomor_plat: 'B 1235 ABC',
        status: 'AKTIF'
      },
      {
        tipe_kendaraan: 'BUS',
        kapasitas: 28,
        nomor_plat: 'B 2001 EXE',
        status: 'AKTIF'
      },
      {
        tipe_kendaraan: 'BUS',
        kapasitas: 28,
        nomor_plat: 'B 2002 EXE',
        status: 'AKTIF'
      },
      {
        tipe_kendaraan: 'BUS',
        kapasitas: 20,
        nomor_plat: 'B 3001 VIP',
        status: 'AKTIF'
      },
      {
        tipe_kendaraan: 'BUS',
        kapasitas: 50,
        nomor_plat: 'B 4001 ECO',
        status: 'AKTIF'
      },
      {
        tipe_kendaraan: 'BUS',
        kapasitas: 50,
        nomor_plat: 'B 4002 ECO',
        status: 'AKTIF'
      },
      {
        tipe_kendaraan: 'TRAVEL',
        kapasitas: 8,
        nomor_plat: 'B 5001 TRV',
        status: 'AKTIF'
      },
      {
        tipe_kendaraan: 'TRAVEL',
        kapasitas: 8,
        nomor_plat: 'B 5002 TRV',
        status: 'AKTIF'
      },
      {
        tipe_kendaraan: 'MINI_BUS',
        kapasitas: 12,
        nomor_plat: 'B 6001 MIN',
        status: 'AKTIF'
      },
      {
        tipe_kendaraan: 'BUS',
        kapasitas: 60,
        nomor_plat: 'B 7001 DD',
        status: 'AKTIF'
      },
      {
        tipe_kendaraan: 'BUS',
        kapasitas: 32,
        nomor_plat: 'B 8001 SLP',
        status: 'AKTIF'
      }
    ];

    // Insert armada data
    const insertedArmada = await Armada.insertMany(armadaData);
    console.log(`✅ Successfully seeded ${insertedArmada.length} armada records`);

    // Display sample data
    console.log('\n📋 Sample armada data:');
    insertedArmada.slice(0, 5).forEach((armada, index) => {
      console.log(`${index + 1}. ${armada.tipe_kendaraan} - ${armada.kapasitas} seats (${armada.nomor_plat})`);
    });

    console.log('🎉 Armada seeding completed successfully!');
    return insertedArmada;

  } catch (error) {
    console.error('❌ Error seeding armada:', error.message);
    throw error;
  }
};

module.exports = seedArmada;

// Run seeder if called directly
if (require.main === module) {
  require('dotenv').config();
  require('../config/database');
  
  seedArmada()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}