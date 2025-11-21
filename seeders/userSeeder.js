const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedUsers = async () => {
  try {
    console.log('🌱 Starting user seeding...');

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@bdnr.com' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}\n`);
      return;
    }

    // Create admin user
    const adminData = {
      name: 'Admin BDNR',
      email: 'admin@bdnr.com',
      password: 'admin123', // Will be hashed by pre-save hook
      phone: '+6281234567890',
      role: 'admin'
    };

    const admin = await User.create(adminData);
    console.log('✅ Admin user created successfully!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   ADMIN CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`   Name:     ${admin.name}`);
    console.log(`   Email:    ${admin.email}`);
    console.log(`   Password: admin123`);
    console.log(`   Role:     ${admin.role}`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Create some sample customers
    const customers = [
      {
        name: 'Budi Santoso',
        email: 'budi@customer.com',
        password: 'customer123',
        phone: '+6281234567891',
        role: 'customer'
      },
      {
        name: 'Siti Nurhaliza',
        email: 'siti@customer.com',
        password: 'customer123',
        phone: '+6281234567892',
        role: 'customer'
      }
    ];

    const createdCustomers = await User.insertMany(customers);
    console.log(`✅ Created ${createdCustomers.length} sample customers\n`);
    
    customers.forEach(c => {
      console.log(`   - ${c.name} (${c.email})`);
      console.log(`     Password: customer123\n`);
    });

    console.log('🎉 User seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    throw error;
  }
};

module.exports = seedUsers;

// Run seeder if called directly
if (require.main === module) {
  require('dotenv').config();
  const connectDB = require('../config/database');
  
  connectDB().then(async () => {
    await seedUsers();
    console.log('✅ Seeding completed');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}
