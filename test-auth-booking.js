// Test authentication flow
const API_BASE = 'http://localhost:5000/api';

// 1. First login to get token
const loginData = {
  email: 'test@example.com', // Use test user we just created
  password: 'test123'
};

console.log('🔐 Testing authentication flow...\n');

fetch(`${API_BASE}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(loginData)
})
.then(response => response.json())
.then(loginResponse => {
  console.log('1️⃣ Login response:', loginResponse);
  
  if (!loginResponse.success) {
    console.error('❌ Login failed:', loginResponse.message);
    return;
  }
  
  const token = loginResponse.data.token;
  const user = loginResponse.data.user;
  
  console.log('✅ Login successful!');
  console.log('🎫 Token:', token.substring(0, 20) + '...');
  console.log('👤 User:', user.name, user.email);
  
  // 2. Now try to create pemesanan with token
  const bookingData = {
    user_pemesan_id: user._id,
    jadwal_id: "69231c194ffe7b9eb8009baa", // Use valid jadwal ID
    daftar_penumpang: [
      {
        nama_lengkap: "Test Booking User",
        nomor_kursi: "A1",
        tipe_identitas: "KTP",
        // nomor_identitas: removed entirely
        tanggal_lahir: "1990-01-01",
        jenis_kelamin: "L",
        nomor_telepon: user.phone || "081234567890",
        email: user.email
      }
    ],
    catatan: "Test booking from script",
    kontak_darurat: {
      nama: user.name,
      nomor_telepon: user.phone || "081234567890", 
      email: user.email
    }
  };
  
  console.log('\n2️⃣ Creating booking with authenticated request...');
  
  return fetch(`${API_BASE}/pemesanan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(bookingData)
  });
})
.then(response => {
  if (!response) return;
  
  console.log('📥 Booking response status:', response.status);
  return response.json();
})
.then(bookingResponse => {
  if (!bookingResponse) return;
  
  console.log('📋 Booking response:', bookingResponse);
  
  if (bookingResponse.success) {
    console.log('✅ Booking created successfully!');
    console.log('🎫 Booking code:', bookingResponse.data.payment_info.kode_booking);
  } else {
    console.error('❌ Booking failed:', bookingResponse.message);
    if (bookingResponse.errors) {
      console.error('📋 Validation errors:', bookingResponse.errors);
    }
  }
})
.catch(error => {
  console.error('💥 Error:', error);
});

console.log('🚀 Test script running... Check logs above.');