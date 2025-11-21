const mongoose = require('mongoose');
const Jadwal = require('../models/Jadwal');

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

const updateExistingSeats = async () => {
  try {
    console.log('🔧 Updating existing jadwal with proper seat maps...');

    // Get all jadwal with armada data
    const jadwals = await Jadwal.find()
      .populate('armada_id', 'tipe_kendaraan kapasitas');

    console.log(`📋 Found ${jadwals.length} jadwal records to update`);

    let updateCount = 0;

    for (const jadwal of jadwals) {
      if (jadwal.armada_id) {
        // Generate proper seat map
        const petaKursi = generateSeatMap(
          jadwal.armada_id.tipe_kendaraan, 
          jadwal.armada_id.kapasitas
        );

        // Update the jadwal
        await Jadwal.findByIdAndUpdate(jadwal._id, {
          peta_kursi: petaKursi,
          kursi_tersedia: jadwal.armada_id.kapasitas
        });

        updateCount++;
        console.log(`✅ Updated jadwal ${jadwal._id} - ${jadwal.armada_id.tipe_kendaraan} (${jadwal.armada_id.kapasitas} seats)`);
      }
    }

    console.log(`🎉 Successfully updated ${updateCount} jadwal records with proper seat maps!`);

    // Show sample of updated data
    console.log('\n📋 Sample updated jadwal:');
    const sampleJadwal = await Jadwal.findOne()
      .populate('armada_id', 'tipe_kendaraan kapasitas nomor_plat')
      .populate('rute_id', 'lokasi_keberangkatan lokasi_tujuan');

    if (sampleJadwal && sampleJadwal.peta_kursi) {
      console.log(`Vehicle: ${sampleJadwal.armada_id.tipe_kendaraan} (${sampleJadwal.armada_id.kapasitas} seats)`);
      console.log(`Route: ${sampleJadwal.rute_id.lokasi_keberangkatan} → ${sampleJadwal.rute_id.lokasi_tujuan}`);
      console.log(`First 10 seats: ${sampleJadwal.peta_kursi.slice(0, 10).map(k => k.nomor_kursi).join(', ')}`);
      console.log(`Total seats in map: ${sampleJadwal.peta_kursi.length}`);
    }

  } catch (error) {
    console.error('❌ Error updating seats:', error.message);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  require('../config/database');
  
  updateExistingSeats()
    .then(() => {
      console.log('✅ Seat update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seat update failed:', error);
      process.exit(1);
    });
}

module.exports = updateExistingSeats;