const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Nvsk%402468@cluster0.xb469xf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) return cachedDb;

    const db = await mongoose.connect(MONGODB_URI);
    cachedDb = db;
    console.log('Connected to the MongoDB database (Serverless Cache).');
    return db;
}

// Define User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    balance_inr: { type: Number, default: 0.0 },
    profile_details: { type: String, default: '{}' },
    search_history: { type: String, default: '[]' }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

const User = mongoose.model('User', userSchema);

module.exports = { User, connectToDatabase };
