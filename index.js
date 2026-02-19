const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');
const axios = require('axios');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Test route - MOVED to /api/test to avoid conflict with frontend
app.get('/api/test', (req, res) => {
    res.send('Backend API is running');
});

// Test DB connection route
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1');
        res.json({ status: 'ok', db: 'connected' });
    } catch (error) {
        console.error('Database health check failed:', error);
        res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
});

// Create User route
app.post('/api/users', async (req, res) => {
    const { username, password, email, phone } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ error: 'Username, password, and email are required' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)',
            [username, password, email, phone]
        );

        res.status(201).json({ id: result.insertId, username, email, phone });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Get Users route
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, email, phone FROM users');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Allow login with either username or email
        const [rows] = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = rows[0];

        // In a real app, successful login would generate a token (JWT).
        // For this simple example, we just check string equality.
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        res.json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email } });

    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// --- Proxy Route for TMDB to fix CORS ---
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Mock Data for Failover
const MOCK_MOVIES = {
    results: [
        {
            id: 101,
            original_language: "en",
            original_title: "Mock Movie: The Beginning",
            overview: "This is a mock movie description because the TMDB API is unreachable. Enjoy the visuals!",
            popularity: 1234.5,
            poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", // Valid TMDB path
            backdrop_path: "/xg27NrXi7VXCGUr7MG75UqLl6Vg.jpg", // Valid TMDB path
            release_date: "2024-01-01",
            title: "Mock Movie: The Beginning",
            vote_average: 8.5,
            vote_count: 1000,
            name: "Mock TV Show",
            original_name: "Mock TV Show Original"
        },
        {
            id: 102,
            original_language: "en",
            original_title: "Mock: The Sequel",
            overview: "Another mock movie to fill the rows. The API connection timed out.",
            popularity: 987.6,
            poster_path: "/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg",
            backdrop_path: "/bQXAqRx2Fgc46uCVWgoPz5L5Dtr.jpg",
            release_date: "2024-02-01",
            title: "Mock: The Sequel",
            vote_average: 7.9,
            vote_count: 850
        },
        {
            id: 103,
            title: "Return of the Mock",
            name: "Return of the Mock",
            overview: "A thrilling conclusion to the mock trilogy.",
            poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
            backdrop_path: "/5Eip60UDiPLASyKjmHPMruggTc4.jpg",
            vote_average: 9.0
        },
        {
            id: 104,
            title: "Mock Action",
            name: "Mock Action",
            overview: "Explosions and mock data everywhere.",
            poster_path: "/pWsD91G2R1Da3AKM3glmBQQNqBC.jpg",
            backdrop_path: "/8rpDcsfLJypbO6vREc05475qg9.jpg",
            vote_average: 6.5
        },
        {
            id: 105,
            title: "Comedy Mock",
            name: "Comedy Mock",
            overview: "Laugh at the lack of API connection.",
            poster_path: "/meyhnvssZOPPjud4F1CjOb4snET.jpg",
            backdrop_path: "/mDeUmPeSPUBkvXnyON884LWHeaC.jpg",
            vote_average: 7.2
        }
    ]
};

// Use app.use to handle all sub-paths under /api/tmdb
app.use('/api/tmdb', async (req, res) => {
    try {
        // In app.use, req.path is relative to the mount point (/api/tmdb)
        const endpoint = req.path; // e.g., "/trending/all/week"
        const query = req.query; // Query params like api_key, language, etc.

        // Construct the full URL
        const queryString = new URLSearchParams(query).toString();
        // endpoint already has a leading slash
        const url = `${TMDB_BASE_URL}${endpoint}?${queryString}`;

        console.log(`Proxying request to: ${url}`);

        // Reduced timeout to fail faster to mock data
        const response = await axios.get(url, { timeout: 2000 });
        res.json(response.data);
    } catch (error) {
        console.error('TMDB Proxy Error:', error.message);

        // MOCK DATA FAILOVER
        console.log('Serving MOCK DATA due to API failure.');
        res.json(MOCK_MOVIES);
    }
});

const fs = require('fs');

// Serve static assets in production
app.use(express.static(path.join(__dirname, 'client/dist')));

app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'client/dist', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend build not found. Please check your build logs on Vercel.');
    }
});

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

process.on('exit', (code) => {
    console.log(`Process exiting with code: ${code}`);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
