const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Koneksi MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const jadwalRoutes = require('./routes/jadwal');
const adminJadwalRoutes = require('./routes/admin/jadwal');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jadwal', jadwalRoutes);
app.use('/api/admin/jadwal', adminJadwalRoutes);

// Routing percobaan
app.get("/", (req, res) => {
  res.send("Backend is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
