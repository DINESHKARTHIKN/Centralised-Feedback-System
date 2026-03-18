const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

dotenv.config(); // Assuming run from server root

const seedUsers = async () => {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Seeding');

        // Check if Admin exists
        const adminExists = await User.findOne({ email: 'admin@college.edu' });
        if (adminExists) {
            console.log('Admin already exists');
            process.exit();
        }

        // Create Admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const admin = new User({
            name: 'Super Admin',
            email: 'admin@college.edu',
            password: hashedPassword,
            role: 'Admin'
        });

        await admin.save();
        console.log('Admin user created: admin@college.edu / admin123');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedUsers();
