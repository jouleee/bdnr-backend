const mongoose = require('mongoose');
const Jadwal = require('../models/Jadwal');
const Rute = require('../models/Rute');
const Armada = require('../models/Armada');

// Function to generate seat map based on vehicle type
const generateSeatMap = (tipeKendaraan, kapasitas) => {
  const petaKursi = [];

  if (tipeKendaraan === 'BUS') {
    // Layout BUS: 4 kursi per baris (2-2), dengan nomor A1, A2, B1, B2, dst
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
    let kursiIndex = 1;
    
    for (let i = 0; i < rows.length && kursiIndex <= kapasitas; i++) {
      for (let j = 1; j <= 4 && kursiIndex <= kapasitas; j++) {
        petaKursi.push({
          nomor_kursi: `${rows[i]}${j}`,
          status_kursi: 'TERSEDIA'
        });
        kursiIndex++;
      }
    }
  } else if (tipeKendaraan === 'MINI_BUS' || tipeKendaraan === 'TRAVEL') {
    // Layout MINI_BUS/TRAVEL: nomor berurutan 1, 2, 3, dst
    for (let i = 1; i <= kapasitas; i++) {
      petaKursi.push({
        nomor_kursi: i.toString(),
        status_kursi: 'TERSEDIA'
      });
    }
  } else {
    // Layout default: nomor berurutan
    for (let i = 1; i <= kapasitas; i++) {
      petaKursi.push({
        nomor_kursi: i.toString(),
        status_kursi: 'TERSEDIA'
      });
    }
  }

  return petaKursi;
};

const seedJadwal = async () => {
  try {
    console.log('🌱 Starting jadwal seeding...');

    // Clear existing jadwal data
    await Jadwal.deleteMany({});
    console.log('✅ Cleared existing jadwal data');

    // Get existing rute and armada data
    const rutes = await Rute.find();
    const armadas = await Armada.find();

    if (rutes.length === 0 || armadas.length === 0) {
      console.log('❌ No rute or armada data found. Please seed rute and armada first.');
      return;
    }

    console.log(`📍 Found ${rutes.length} routes and ${armadas.length} vehicles`);

    // Generate jadwal data
    const jadwalData = [];
    const waktuBerangkat = ['06:00:00', '08:00:00', '10:00:00', '12:00:00', '14:00:00', '16:00:00', '18:00:00', '20:00:00'];
    const estimasiWaktu = ['02:00:00', '03:00:00', '04:00:00', '05:00:00', '06:00:00'];
    const hargaDasar = [50000, 60000, 75000, 80000, 90000, 100000];

    // Create multiple jadwal for each rute with different armada and times
    for (let i = 0; i < rutes.length; i++) {
      const rute = rutes[i];
      
      // Create 3-4 jadwal per route with different times and vehicles
      for (let j = 0; j < 4; j++) {
        const armada = armadas[Math.floor(Math.random() * armadas.length)];
        const waktu = waktuBerangkat[Math.floor(Math.random() * waktuBerangkat.length)];
        const estimasi = estimasiWaktu[Math.floor(Math.random() * estimasiWaktu.length)];
        const harga = hargaDasar[Math.floor(Math.random() * hargaDasar.length)];
        
        // Create dates for the next 7 days
        const today = new Date();
        const waktuKeberangkatan = new Date(today);
        waktuKeberangkatan.setDate(today.getDate() + j); // j days from today
        
        // Set specific time
        const [hours, minutes] = waktu.split(':');
        waktuKeberangkatan.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Generate seat map based on vehicle type
        const petaKursi = generateSeatMap(armada.tipe_kendaraan, armada.kapasitas);

        jadwalData.push({
          rute_id: rute._id,
          armada_id: armada._id,
          waktu_keberangkatan: waktuKeberangkatan,
          estimasi_waktu_perjalanan: estimasi,
          harga_dasar: harga,
          status_jadwal: 'AKTIF',
          kursi_tersedia: armada.kapasitas,
          peta_kursi: petaKursi
        });
      }
    }

    // Insert jadwal data
    const insertedJadwal = await Jadwal.insertMany(jadwalData);
    console.log(`✅ Successfully seeded ${insertedJadwal.length} jadwal records`);

    // Display some sample data
    console.log('\n📋 Sample jadwal data:');
    const sampleJadwal = await Jadwal.find()
      .populate('rute_id', 'lokasi_keberangkatan lokasi_tujuan')
      .populate('armada_id', 'tipe_kendaraan kapasitas nomor_plat')
      .limit(3);
    
    sampleJadwal.forEach((jadwal, index) => {
      console.log(`${index + 1}. ${jadwal.rute_id.lokasi_keberangkatan} → ${jadwal.rute_id.lokasi_tujuan}`);
      console.log(`   Vehicle: ${jadwal.armada_id.tipe_kendaraan} (${jadwal.armada_id.nomor_plat})`);
      console.log(`   Date: ${jadwal.waktu_keberangkatan.toDateString()}`);
      console.log(`   Time: ${jadwal.waktu_keberangkatan.toTimeString().slice(0, 8)}`);
      console.log(`   Price: Rp ${jadwal.harga_dasar.toLocaleString()}`);
      console.log(`   Available Seats: ${jadwal.kursi_tersedia}/${jadwal.armada_id.kapasitas}`);
      console.log(`   Seat Map: ${jadwal.peta_kursi ? jadwal.peta_kursi.slice(0, 5).map(k => k.nomor_kursi).join(', ') + '...' : 'Not available'}`);
      console.log('');
    });

    console.log('🎉 Jadwal seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding jadwal:', error.message);
    throw error;
  }
};

module.exports = seedJadwal;

// Run seeder if called directly
if (require.main === module) {
  require('dotenv').config();
  require('../config/database');
  
  seedJadwal()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}