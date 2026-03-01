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

// Safer DB loading - Lazy Initialization
let pool = null;

const getDb = async () => {
    if (pool) return pool;

    try {
        const mysql = require('mysql2/promise');
        pool = mysql.createPool({
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
        console.log("Database pool created.");

        // Test connection
        await pool.query('SELECT 1');
        console.log("Database connection verified.");

        return pool;
    } catch (error) {
        console.error("Failed to initialize database pool:", error);
        pool = null; // Reset on failure
        throw error;
    }
};

// DB Helper
const withDb = async (res, callback) => {
    try {
        const db = await getDb();
        await callback(db);
    } catch (error) {
        console.error("Database operation failed:", error);
        res.status(503).json({ error: 'Database service unavailable.', details: error.message });
    }
};

// Test routes
app.get('/api/test', (req, res) => {
    const envStatus = {
        DB_HOST: !!process.env.DB_HOST,
        DB_USER: !!process.env.DB_USER,
        PORT: process.env.PORT
    };
    res.json({ message: 'Backend API is running', env: envStatus });
});

app.get('/api/health', async (req, res) => {
    await withDb(res, async (db) => {
        await db.query('SELECT 1');
        res.json({ status: 'ok', db: 'connected' });
    });
});

app.post('/api/users', async (req, res) => {
    await withDb(res, async (db) => {
        const { username, password, email, phone } = req.body;
        if (!username || !password || !email) {
            return res.status(400).json({ error: 'Username, password, and email are required' });
        }
        const [result] = await db.query(
            'INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)',
            [username, password, email, phone]
        );
        res.status(201).json({ id: result.insertId, username, email, phone });
    });
});

app.get('/api/users', async (req, res) => {
    await withDb(res, async (db) => {
        const [rows] = await db.query('SELECT id, username, email, phone FROM users');
        res.json(rows);
    });
});

app.post('/api/login', async (req, res) => {
    await withDb(res, async (db) => {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
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
    });
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
    ]
};

app.use('/api/tmdb', async (req, res) => {
    try {
        const endpoint = req.path;
        console.log(`Proxying TMDB request: ${endpoint}`);
        const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
            params: req.query,
            timeout: 3000
        });
        res.json(response.data);
    } catch (error) {
        console.error('TMDB Proxy Error:', error.message);
        res.json(MOCK_MOVIES);
    }
});

// Serve Frontend (Robust Safe-Guard)
const clientPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientPath)) {
    app.use(express.static(clientPath));
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
        res.sendFile(path.join(clientPath, 'index.html'));
    });
} else {
    console.warn(`Client build not found at ${clientPath}. Serving API only.`);
    app.get('/', (req, res) => {
        res.send('API is running. Frontend build not found.');
    });
}

// Global error handler - always return JSON, never let Vercel show HTML error
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
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
