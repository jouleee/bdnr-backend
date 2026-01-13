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
const pemesananRoutes = require('./routes/pemesanan');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jadwal', jadwalRoutes);
app.use('/api/admin/jadwal', adminJadwalRoutes);
app.use('/api/pemesanan', pemesananRoutes);

// Routing percobaan
app.get("/", (req, res) => {
  res.send("Backend is running...");
});

// Health check endpoint for Render
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is healthy" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
