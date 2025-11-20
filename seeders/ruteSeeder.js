const mongoose = require('mongoose');
const Rute = require('../models/Rute');

const seedRute = async () => {
  try {
    console.log('🌱 Starting rute seeding...');

    // Clear existing rute data
    await Rute.deleteMany({});
    console.log('✅ Cleared existing rute data');

    // Sample route data
    const ruteData = [
      {
        lokasi_keberangkatan: 'Jakarta',
        lokasi_tujuan: 'Bandung',
        tanggal_keberangkatan: new Date('2024-12-25')
      },
      {
        lokasi_keberangkatan: 'Jakarta',
        lokasi_tujuan: 'Surabaya',
        tanggal_keberangkatan: new Date('2024-12-25')
      },
      {
        lokasi_keberangkatan: 'Jakarta',
        lokasi_tujuan: 'Yogyakarta',
        tanggal_keberangkatan: new Date('2024-12-25')
      },
      {
        lokasi_keberangkatan: 'Jakarta',
        lokasi_tujuan: 'Semarang',
        tanggal_keberangkatan: new Date('2024-12-25')
      },
      {
        lokasi_keberangkatan: 'Bandung',
        lokasi_tujuan: 'Jakarta',
        tanggal_keberangkatan: new Date('2024-12-25')
      },
      {
        lokasi_keberangkatan: 'Bandung',
        lokasi_tujuan: 'Yogyakarta',
        tanggal_keberangkatan: new Date('2024-12-25')
      },
      {
        lokasi_keberangkatan: 'Surabaya',
        lokasi_tujuan: 'Jakarta',
        tanggal_keberangkatan: new Date('2024-12-25')
      },
      {
        lokasi_keberangkatan: 'Surabaya',
        lokasi_tujuan: 'Malang',
        tanggal_keberangkatan: new Date('2024-12-25')
      },
      {
        lokasi_keberangkatan: 'Yogyakarta',
        lokasi_tujuan: 'Jakarta',
        tanggal_keberangkatan: new Date('2024-12-25')
      },
      {
        lokasi_keberangkatan: 'Yogyakarta',
        lokasi_tujuan: 'Solo',
        tanggal_keberangkatan: new Date('2024-12-25')
      },
      {
        lokasi_keberangkatan: 'Semarang',
        lokasi_tujuan: 'Jakarta',
        tanggal_keberangkatan: new Date('2024-12-25')
      },
      {
        lokasi_keberangkatan: 'Malang',
        lokasi_tujuan: 'Surabaya',
        tanggal_keberangkatan: new Date('2024-12-25')
      }
    ];

    // Insert rute data
    const insertedRute = await Rute.insertMany(ruteData);
    console.log(`✅ Successfully seeded ${insertedRute.length} rute records`);

    // Display sample data
    console.log('\n📋 Sample rute data:');
    insertedRute.slice(0, 5).forEach((rute, index) => {
      console.log(`${index + 1}. ${rute.lokasi_keberangkatan} → ${rute.lokasi_tujuan}`);
    });

    console.log('🎉 Rute seeding completed successfully!');
    return insertedRute;

  } catch (error) {
    console.error('❌ Error seeding rute:', error.message);
    throw error;
  }
};

module.exports = seedRute;

// Run seeder if called directly
if (require.main === module) {
  require('dotenv').config();
  require('../config/database');
  
  seedRute()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}