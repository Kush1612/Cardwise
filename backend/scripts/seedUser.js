const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cardwise';

const seed = async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for seeding');

    const email = process.env.SEED_EMAIL || 'test@test.com';
    const password = process.env.SEED_PASSWORD || 'test123';
    const name = process.env.SEED_NAME || 'Test User';

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log('User already exists:', existing.email);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email: email.toLowerCase(), password: hashed });
    console.log('Seeded user:', user.email);
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
