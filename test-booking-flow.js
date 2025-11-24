const mongoose = require('mongoose');
const Pemesanan = require('./models/Pemesanan');
const Jadwal = require('./models/Jadwal');
const User = require('./models/User');
const Rute = require('./models/Rute');
const Armada = require('./models/Armada');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/bismillah')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testBookingFlow() {
  try {
    console.log('🧪 Testing Booking Flow with Simplified Data Structure\n');

    // 1. Find test data
    console.log('1️⃣ Finding test data...');
    const jadwal = await Jadwal.findOne().populate('rute_id armada_id');
    const user = await User.findOne({ role: 'customer' });

    if (!jadwal) {
      console.log('❌ No jadwal found');
      return;
    }
    if (!user) {
      console.log('❌ No customer user found');
      return;
    }

    console.log(`✅ Found jadwal: ${jadwal.rute_id.lokasi_keberangkatan} → ${jadwal.rute_id.lokasi_tujuan}`);
    console.log(`✅ Found user: ${user.email}`);

    // 2. Test simplified booking data structure
    console.log('\n2️⃣ Creating simplified booking...');
    
    const simplifiedBookingData = {
      user_pemesan_id: user._id,
      jadwal_id: jadwal._id,
      jumlah_penumpang: 2,
      harga_per_tiket: jadwal.harga || 50000,
      total_harga: (jadwal.harga || 50000) * 2,
      daftar_penumpang: [
        {
          nama_lengkap: "John Doe",
          nomor_kursi: "A1",
          // Optional fields with defaults
          tipe_identitas: "KTP",
          nomor_identitas: "1234567890123456",
          tanggal_lahir: new Date('1990-01-01'),
          jenis_kelamin: "L",
        },
        {
          nama_lengkap: "Jane Doe", 
          nomor_kursi: "A2",
          // Minimal data - only required fields
          tipe_identitas: "KTP",
          nomor_identitas: "9876543210987654", 
          tanggal_lahir: new Date('1992-05-15'),
          jenis_kelamin: "P",
        }
      ],
      // Optional kontak_darurat
      kontak_darurat: {
        nama: "Emergency Contact",
        nomor_telepon: "081234567890",
        email: "emergency@example.com"
      },
      catatan: "Test booking with simplified structure",
      // Auto-generated fields
      kode_booking: `TST${Date.now()}`,
      status_pemesanan: 'MENUNGGU_PEMBAYARAN',
      status_pembayaran: 'MENUNGGU_PEMBAYARAN',
      batas_waktu_pembayaran: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      waktu_pemesanan: new Date()
    };

    // 3. Create booking
    const newBooking = new Pemesanan(simplifiedBookingData);
    await newBooking.save();
    console.log(`✅ Booking created with ID: ${newBooking._id}`);
    console.log(`✅ Booking code: ${newBooking.kode_booking}`);

    // 4. Test retrieval
    console.log('\n3️⃣ Testing booking retrieval...');
    const retrievedBooking = await Pemesanan.findById(newBooking._id)
      .populate({
        path: 'jadwal_id',
        populate: [
          { path: 'rute_id' },
          { path: 'armada_id' }
        ]
      })
      .populate('user_pemesan_id');

    if (retrievedBooking) {
      console.log('✅ Booking retrieved successfully');
      console.log(`📋 Penumpang count: ${retrievedBooking.daftar_penumpang.length}`);
      console.log(`📋 Route: ${retrievedBooking.jadwal_id.rute_id.lokasi_keberangkatan} → ${retrievedBooking.jadwal_id.rute_id.lokasi_tujuan}`);
      console.log(`📋 Status: ${retrievedBooking.status_pemesanan}`);
    }

    // 5. Test minimal booking (only essential fields)
    console.log('\n4️⃣ Testing minimal booking data...');
    
    const minimalBookingData = {
      user_pemesan_id: user._id,
      jadwal_id: jadwal._id,
      jumlah_penumpang: 1,
      harga_per_tiket: jadwal.harga || 50000,
      total_harga: jadwal.harga || 50000,
      daftar_penumpang: [
        {
          nama_lengkap: "Minimal User",
          nomor_kursi: "B1"
          // No other fields - should use defaults
        }
      ],
      kode_booking: `MIN${Date.now()}`,
      status_pemesanan: 'MENUNGGU_PEMBAYARAN',
      waktu_pemesanan: new Date()
    };

    const minimalBooking = new Pemesanan(minimalBookingData);
    await minimalBooking.save();
    console.log(`✅ Minimal booking created with ID: ${minimalBooking._id}`);

    // 6. Test payment update
    console.log('\n5️⃣ Testing payment update...');
    retrievedBooking.status_pemesanan = 'LUNAS';
    retrievedBooking.status_pembayaran = 'LUNAS';
    retrievedBooking.waktu_pembayaran = new Date();
    await retrievedBooking.save();
    console.log('✅ Payment status updated successfully');

    // 7. Test user history
    console.log('\n6️⃣ Testing user booking history...');
    const userBookings = await Pemesanan.find({ user_pemesan_id: user._id })
      .populate({
        path: 'jadwal_id',
        populate: [
          { path: 'rute_id' },
          { path: 'armada_id' }
        ]
      })
      .sort({ waktu_pemesanan: -1 });

    console.log(`✅ Found ${userBookings.length} bookings for user`);
    userBookings.forEach((booking, index) => {
      console.log(`📋 ${index + 1}. ${booking.kode_booking} - ${booking.status_pemesanan}`);
    });

    console.log('\n🎉 All tests passed! Booking flow is working with simplified data structure.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    mongoose.disconnect();
  }
}

testBookingFlow();