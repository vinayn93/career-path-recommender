const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, connectToDatabase } = require('./database');
const { careers, resources } = require('./data/mockData');

// Secret key for JWT (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'career-recommender-super-secret-key';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token.' });
        req.user = user;
        next();
    });
};

// --- AUTHENTICATION & USER ENDPOINTS ---

// Register
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        await connectToDatabase();
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const newUser = await User.create({ username, password_hash: hashedPassword });
            res.status(201).json({ message: 'User registered successfully.', userId: newUser._id });
        } catch (err) {
            if (err.code === 11000) {
                return res.status(409).json({ error: 'Username already exists.' });
            }
            console.error(err);
            return res.status(500).json({ error: 'Database error.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        await connectToDatabase();
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: 'Login successful.', token, username: user.username, balance: user.balance_inr });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error.' });
    }
});

// Get User Balance
app.get('/api/user/balance', authenticateToken, async (req, res) => {
    try {
        await connectToDatabase();
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json({ username: user.username, balance: user.balance_inr });
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

// Add Funds (Mock functionality for demonstration)
app.post('/api/user/add-funds', authenticateToken, async (req, res) => {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required.' });
    }

    try {
        await connectToDatabase();
        const user = await User.findByIdAndUpdate(req.user.id, { $inc: { balance_inr: amount } }, { new: true });
        res.json({ message: 'Funds added successfully.', balance: user.balance_inr });
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

// Get Current User Profile
app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        await connectToDatabase();
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        let profileDetails = {};
        let searchHistory = [];
        try {
            if (user.profile_details) profileDetails = JSON.parse(user.profile_details);
            if (user.search_history) searchHistory = JSON.parse(user.search_history);
        } catch (e) {
            console.error("JSON parse error:", e);
        }

        res.json({
            username: user.username,
            balance: user.balance_inr,
            profileDetails,
            searchHistory
        });
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

// Update Profile Details
app.put('/api/profile', authenticateToken, async (req, res) => {
    const { profileDetails } = req.body;

    if (!profileDetails || typeof profileDetails !== 'object') {
        return res.status(400).json({ error: 'Invalid profile details format.' });
    }

    try {
        await connectToDatabase();
        const jsonStr = JSON.stringify(profileDetails);
        await User.findByIdAndUpdate(req.user.id, { profile_details: jsonStr });
        res.json({ message: 'Profile updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

// --- EXISTING RECOMMENDATION ENDPOINTS ---

// API Endpoint: Recommend Careers based on skills & interests
app.post('/api/recommend', (req, res) => {
    const { skills, interests } = req.body;

    if (!skills || !Array.isArray(skills)) {
        return res.status(400).json({ error: 'Skills array is required.' });
    }

    const userProfile = [...skills.map(s => s.toLowerCase()), ...(interests || []).map(i => i.toLowerCase())];

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, JWT_SECRET, async (err, user) => {
            if (!err && user) {
                try {
                    await connectToDatabase();
                    const row = await User.findById(user.id);
                    if (row) {
                        let history = [];
                        try { if (row.search_history) history = JSON.parse(row.search_history); } catch (e) { }

                        userProfile.forEach(p => {
                            if (!history.includes(p)) history.push(p);
                        });

                        await User.findByIdAndUpdate(user.id, { search_history: JSON.stringify(history) });
                    }
                } catch (e) { console.error(e) }
            }
        });
    }

    // Calculate match score for each career
    const recommendations = careers.map(career => {
        const careerKeywords = [...career.skillsRequired.map(s => s.toLowerCase()), ...career.relatedInterests.map(i => i.toLowerCase())];

        // Count matches
        let matchCount = 0;
        userProfile.forEach(kw => {
            if (careerKeywords.some(ck => ck.includes(kw) || kw.includes(ck))) {
                matchCount++;
            }
        });

        // AI Match Score calculation (0-100%)
        const maxPossibleMatches = Math.min(userProfile.length, careerKeywords.length) || 1;
        // Boost score slightly just to make results feel more dynamic, capping at 98% for realism
        let matchScore = Math.floor((matchCount / maxPossibleMatches) * 100);

        // Bonus for having any match
        if (matchCount > 0) matchScore = Math.min(98, matchScore + 15);

        return {
            ...career,
            matchCount,
            matchScore
        };
    }).filter(c => c.matchCount > 0);

    // Sort by descending match score
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    // Provide top 5 recommendations
    res.json({ recommendations: recommendations.slice(0, 5) });
});

// API Endpoint: Compare specific careers by ID
app.get('/api/compare', (req, res) => {
    const ids = req.query.ids; // expect comma-separated IDs: ?ids=c1,c2
    if (!ids) {
        return res.status(400).json({ error: 'Career IDs are required for comparison.' });
    }

    const idArray = ids.split(',').slice(0, 3); // max 3 for comparison at a time
    const comparisonData = careers.filter(c => idArray.includes(c.id));

    res.json({ comparison: comparisonData });
});

// API Endpoint: Get learning resources for a career ID
app.get('/api/resources/:careerId', (req, res) => {
    const { careerId } = req.params;
    const careerResources = resources[careerId] || [];
    res.json({ resources: careerResources });
});

// Fallback to serve index.html for SPA router (if we add one later)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Career Path Recommender Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
