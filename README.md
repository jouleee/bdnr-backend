# 🚌 BDNR Backend API

Express.js REST API dengan MongoDB untuk sistem pemesanan tiket bus.

## 🚀 Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Buat file `.env` di root folder:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bdnr
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Seed Database
```bash
npm run seed
```

Atau jalankan seeder individual:
```bash
node seeders/userSeeder.js
node seeders/ruteSeeder.js
node seeders/armadaSeeder.js
node seeders/jadwalSeeder.js
```

### 4. Start Server
```bash
npm start
```

Server akan running di `http://localhost:5000`

## 📁 Project Structure

```
bdnr-backend/
├── config/
│   └── database.js          # MongoDB connection config
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── jadwalController.js  # Schedule management
│   ├── pemesananController.js # Booking management
│   └── userController.js    # User management
├── middleware/
│   └── auth.js             # JWT authentication middleware
├── models/
│   ├── User.js             # User model & schema
│   ├── Rute.js             # Route model
│   ├── Armada.js           # Vehicle fleet model
│   ├── Jadwal.js           # Schedule model with seat map
│   └── Pemesanan.js        # Booking model
├── routes/
│   ├── auth.js             # Auth endpoints
│   ├── users.js            # User endpoints
│   ├── jadwal.js           # Public schedule endpoints
│   ├── pemesanan.js        # Booking endpoints
│   └── admin/
│       └── jadwal.js       # Admin schedule management
├── seeders/
│   ├── index.js            # Main seeder runner
│   ├── userSeeder.js       # Seed admin & customers
│   ├── ruteSeeder.js       # Seed routes
│   ├── armadaSeeder.js     # Seed vehicles
│   └── jadwalSeeder.js     # Seed schedules
├── .env                    # Environment variables
├── .gitignore
├── package.json
└── server.js               # Entry point
```

## 🔐 Authentication

API menggunakan JWT (JSON Web Token) untuk authentication.

### Login Flow
1. User login → `POST /api/auth/login`
2. Server return JWT token
3. Client simpan token
4. Setiap request protected endpoint, kirim token di header:
   ```
   Authorization: Bearer <token>
   ```

## 📝 API Endpoints

### 🔑 Authentication (`/api/auth`)

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "081234567890",
  "role": "customer"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### 📅 Jadwal (`/api/jadwal`)

#### Get All Schedules (with filters)
```http
GET /api/jadwal?lokasi_keberangkatan=Jakarta&lokasi_tujuan=Bandung&tanggal_keberangkatan=2025-11-22
```

Query params:
- `lokasi_keberangkatan` - Filter by origin
- `lokasi_tujuan` - Filter by destination
- `tanggal_keberangkatan` - Filter by date (YYYY-MM-DD)
- `status_jadwal` - Filter by status (AKTIF, BATAL, etc)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

#### Get Schedule Detail
```http
GET /api/jadwal/:id
```

### 🎫 Pemesanan (`/api/pemesanan`)

#### Get Available Seats
```http
GET /api/pemesanan/jadwal/:jadwalId/seats
```

#### Create Booking
```http
POST /api/pemesanan
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_pemesan_id": "user_id",
  "jadwal_id": "jadwal_id",
  "kontak_darurat": {
    "nama": "Emergency Contact",
    "telepon": "081234567890",
    "hubungan": "Keluarga"
  },
  "daftar_penumpang": [
    {
      "nama": "Passenger 1",
      "nik": "1234567890123456",
      "jenis_kelamin": "Laki-laki",
      "nomor_kursi": "A1"
    }
  ],
  "kursi_dipesan": ["A1", "A2"],
  "catatan": "Optional notes"
}
```

#### Get Booking Detail
```http
GET /api/pemesanan/:identifier
Authorization: Bearer <token>
```
Note: `identifier` bisa ID atau kode booking

#### Get User Booking History
```http
GET /api/pemesanan/user/:userId?status=LUNAS&page=1&limit=10
Authorization: Bearer <token>
```

#### Process Payment
```http
POST /api/pemesanan/:id/payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "metode_pembayaran": "Bank Transfer",
  "referensi_pembayaran": "TRF-123456",
  "jumlah_bayar": 100000
}
```

#### Cancel Booking
```http
POST /api/pemesanan/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "alasan": "Reason for cancellation"
}
```

### 👨‍💼 Admin Jadwal (`/api/admin/jadwal`)

#### Create Schedule
```http
POST /api/admin/jadwal
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "rute_id": "rute_id",
  "armada_id": "armada_id",
  "waktu_keberangkatan": "2025-11-23T08:00:00Z",
  "estimasi_waktu_perjalanan": "05:30:00",
  "harga_dasar": 100000
}
```

#### Update Schedule
```http
PUT /api/admin/jadwal/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "harga_dasar": 120000,
  "status_jadwal": "AKTIF"
}
```

#### Delete Schedule
```http
DELETE /api/admin/jadwal/:id
Authorization: Bearer <admin_token>
```

## 💾 Database Models

### User
- name, email, password (hashed)
- phone, role (customer/admin)

### Rute
- lokasi_keberangkatan, lokasi_tujuan
- tanggal_keberangkatan, estimasi_durasi
- jarak_km, tarif_per_km

### Armada
- tipe_kendaraan (BUS, MINI_BUS, TRAVEL)
- kapasitas, nomor_polisi, tahun_produksi
- status_armada (TERSEDIA, SEDANG_DIGUNAKAN, MAINTENANCE)

### Jadwal
- rute_id (ref: Rute)
- armada_id (ref: Armada)
- waktu_keberangkatan, estimasi_waktu_perjalanan
- harga_dasar, status_jadwal, kursi_tersedia
- peta_kursi (array of seats with status)

### Pemesanan
- user_pemesan_id (ref: User)
- jadwal_id (ref: Jadwal)
- kode_booking (auto-generated)
- daftar_penumpang, kursi_dipesan
- total_harga, status_pemesanan
- pembayaran (metode, referensi, waktu)
- batas_waktu_pembayaran

## 🔧 NPM Scripts

```bash
npm start          # Start server
npm run seed       # Run all seeders
npm run dev        # Start with nodemon (if configured)
```

## ⚠️ Important Notes

1. **JWT_SECRET** harus diganti dengan secret yang kuat di production
2. **MongoDB** harus running sebelum start server
3. **Seeding** akan menghapus data existing, hati-hati di production
4. **CORS** sudah dikonfigurasi untuk frontend di localhost:3000

## 🐛 Troubleshooting

### MongoDB Connection Error
- Pastikan MongoDB service running
- Check MONGODB_URI di `.env`
- Test connection: `mongosh mongodb://localhost:27017`

### JWT Error
- Check JWT_SECRET di `.env`
- Pastikan token valid dan belum expired

### Seeder Error
- Drop database dan seed ulang: `mongosh bdnr --eval "db.dropDatabase()"`
- Re-run: `npm run seed`

## 📧 Support

Untuk issue atau pertanyaan, hubungi tim development.

---

**BDNR Backend API v1.0**
