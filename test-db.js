// Test script untuk cek data di database
const mongoose = require("mongoose");
require("dotenv").config();

const Jadwal = require('./models/Jadwal');
const Rute = require('./models/Rute');
const Armada = require('./models/Armada');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for testing");

    // Check collections
    const jadwalCount = await Jadwal.countDocuments();
    const ruteCount = await Rute.countDocuments();
    const armadaCount = await Armada.countDocuments();

    console.log(`Collections count:`);
    console.log(`- Jadwal: ${jadwalCount}`);
    console.log(`- Rute: ${ruteCount}`);
    console.log(`- Armada: ${armadaCount}`);

    // Get sample data
    if (jadwalCount > 0) {
      const sampleJadwal = await Jadwal.findOne()
        .populate('rute_id')
        .populate('armada_id');
      console.log('\nSample Jadwal:');
      console.log(JSON.stringify(sampleJadwal, null, 2));
    }

    if (ruteCount > 0) {
      const sampleRute = await Rute.findOne();
      console.log('\nSample Rute:');
      console.log(JSON.stringify(sampleRute, null, 2));
    }

    if (armadaCount > 0) {
      const sampleArmada = await Armada.findOne();
      console.log('\nSample Armada:');
      console.log(JSON.stringify(sampleArmada, null, 2));
    }

    // Check if collections have the right names
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAll collections in database:');
    collections.forEach(col => console.log(`- ${col.name}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkData();