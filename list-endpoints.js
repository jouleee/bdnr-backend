console.log('\n=== DAFTAR SEMUA API ENDPOINTS ===\n');

// Manual list of endpoints based on routes analysis
const endpoints = [
  // AUTH endpoints
  { method: 'POST', path: '/api/auth/register', desc: 'Register user baru' },
  { method: 'POST', path: '/api/auth/login', desc: 'Login user' },
  
  // USER endpoints  
  { method: 'GET', path: '/api/users/:id', desc: 'Get user profile (auth required)' },
  { method: 'PUT', path: '/api/users/:id', desc: 'Update user profile (auth required)' },
  
  // JADWAL endpoints
  { method: 'GET', path: '/api/jadwal', desc: 'Get semua jadwal dengan filter/search' },
  { method: 'GET', path: '/api/jadwal/:id', desc: 'Get jadwal by ID' },
  
  // PEMESANAN endpoints
  { method: 'GET', path: '/api/pemesanan/jadwal/:jadwalId/seats', desc: 'Get kursi tersedia untuk jadwal' },
  { method: 'POST', path: '/api/pemesanan', desc: 'Buat pemesanan baru (auth required)' },
  { method: 'GET', path: '/api/pemesanan/user/:userId', desc: 'Get history pemesanan user (auth required)' },
  { method: 'GET', path: '/api/pemesanan/:identifier', desc: 'Get pemesanan by ID/booking code (auth required)' },
  { method: 'POST', path: '/api/pemesanan/:id/payment', desc: 'Proses pembayaran (auth required)' },
  { method: 'POST', path: '/api/pemesanan/:id/cancel', desc: 'Cancel pemesanan (auth required)' },
  
  // ADMIN endpoints (admin auth required)
  { method: 'POST', path: '/api/admin/jadwal', desc: 'Buat jadwal baru (admin only)' },
  { method: 'PUT', path: '/api/admin/jadwal/:id', desc: 'Update jadwal (admin only)' },
  { method: 'DELETE', path: '/api/admin/jadwal/:id', desc: 'Hapus jadwal (admin only)' },
  
  // Basic endpoint
  { method: 'GET', path: '/', desc: 'Basic health check' }
];

// Group by category
const categories = {
  'Authentication': endpoints.filter(e => e.path.includes('/auth')),
  'User Management': endpoints.filter(e => e.path.includes('/users')),
  'Jadwal (Schedule)': endpoints.filter(e => e.path.includes('/jadwal') && !e.path.includes('/admin')),
  'Pemesanan (Booking)': endpoints.filter(e => e.path.includes('/pemesanan')),
  'Admin Functions': endpoints.filter(e => e.path.includes('/admin')),
  'Other': endpoints.filter(e => e.path === '/')
};

// Display grouped endpoints
Object.entries(categories).forEach(([category, categoryEndpoints]) => {
  if (categoryEndpoints.length > 0) {
    console.log(`\n📂 ${category.toUpperCase()}`);
    console.log('='.repeat(50));
    
    categoryEndpoints.forEach(endpoint => {
      const methodColor = endpoint.method === 'GET' ? '🟢' : 
                         endpoint.method === 'POST' ? '🟡' : 
                         endpoint.method === 'PUT' ? '🔵' : 
                         endpoint.method === 'DELETE' ? '🔴' : '⚪';
      
      console.log(`${methodColor} ${endpoint.method.padEnd(7)} ${endpoint.path.padEnd(40)} - ${endpoint.desc}`);
    });
  }
});

console.log(`\n📊 SUMMARY:`);
console.log(`Total endpoints: ${endpoints.length}`);
console.log(`🟢 GET: ${endpoints.filter(e => e.method === 'GET').length}`);
console.log(`🟡 POST: ${endpoints.filter(e => e.method === 'POST').length}`);
console.log(`🔵 PUT: ${endpoints.filter(e => e.method === 'PUT').length}`);
console.log(`🔴 DELETE: ${endpoints.filter(e => e.method === 'DELETE').length}`);

console.log(`\n🔗 BASE URL: http://localhost:5000`);
console.log(`\n💡 Tips:`);
console.log(`   - Jalankan server: npm run dev`);
console.log(`   - Test dengan Postman/Thunder Client`);
console.log(`   - Endpoints dengan (auth required) perlu token JWT`);