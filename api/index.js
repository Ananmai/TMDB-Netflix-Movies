const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// handlers must be first
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const path = require('path');
const fs = require('fs');

app.use(cors());
app.use(express.json());

// Safer DB loading
let db;
let dbConnected = false;

try {
    const mysql = require('mysql2');
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000 // 10s timeout
    });
    db = pool.promise();
    dbConnected = true;
    console.log("Database configuration loaded successfully (Inlined).");
} catch (error) {
    console.error("Failed to load database configuration:", error);
    dbConnected = false;
}

// Helper to check DB
const checkDb = (res) => {
    if (!dbConnected) {
        console.error("Attempted to access DB, but connection is failed.");
        res.status(503).json({ error: 'Database service unavailable. Check server logs.' });
        return false;
    }
    return true;
};

// Test routes
app.get('/api/test', (req, res) => {
    res.send('Backend API is running. DB Status: ' + (dbConnected ? 'Loaded' : 'FAILED'));
});

app.get('/api/health', async (req, res) => {
    if (!checkDb(res)) return;
    try {
        await db.query('SELECT 1');
        res.json({ status: 'ok', db: 'connected' });
    } catch (error) {
        console.error('Database health check failed:', error);
        res.status(500).json({ status: 'error', message: 'Database connection failed', details: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    if (!checkDb(res)) return;
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

app.get('/api/users', async (req, res) => {
    if (!checkDb(res)) return;
    try {
        const [rows] = await db.query('SELECT id, username, email, phone FROM users');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/login', async (req, res) => {
    if (!checkDb(res)) return;
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const user = rows[0];
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        res.json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// --- TMDb Proxy ---
const axios = require('axios');
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const MOCK_MOVIES = {
    results: [
        {
            id: 101, original_title: "Mock Movie: The Beginning", overview: "Mock data due to API failure.",
            poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", backdrop_path: "/xg27NrXi7VXCGUr7MG75UqLl6Vg.jpg",
            title: "Mock Movie: The Beginning", vote_average: 8.5
        },
        // ... (truncated for brevity, keeping it simple)
    ]
};

app.use('/api/tmdb', async (req, res) => {
    try {
        const endpoint = req.path;
        const query = req.query;
        const queryString = new URLSearchParams(query).toString();
        const url = `${TMDB_BASE_URL}${endpoint}?${queryString}`;
        console.log(`Proxying request to: ${url}`);
        const response = await axios.get(url, { timeout: 2000 });
        res.json(response.data);
    } catch (error) {
        console.error('TMDB Proxy Error:', error.message);
        res.json(MOCK_MOVIES);
    }
});

// Serve Frontend
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '../client/dist', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend build not found. Please check your build logs on Vercel.');
    }
});

// Export app for Vercel
module.exports = app;

// Only listen if run directly (not imported as a module)
if (require.main === module) {
    const server = app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

process.on('exit', (code) => {
    console.log(`Process exiting with code: ${code}`);
});
