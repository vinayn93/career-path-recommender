const mongoose = require('mongoose');

// Fallback to local MongoDB URI if the environment variable isn't set
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Nvsk%402468@cluster0.xb469xf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB Atlas
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to the MongoDB database.'))
    .catch((err) => console.error('Error connecting to MongoDB:', err.message));

// Define User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    balance_inr: { type: Number, default: 0.0 },
    profile_details: { type: String, default: '{}' },
    search_history: { type: String, default: '[]' }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

const User = mongoose.model('User', userSchema);

module.exports = { User };
