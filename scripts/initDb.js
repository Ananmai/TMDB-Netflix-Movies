const db = require('../config/db');

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20)
  )
`;

async function initDb() {
    try {
        console.log('Testing database connection...');
        await db.query('SELECT 1');
        console.log('Database connected successfully.');

        console.log('Creating users table if it does not exist...');
        await db.query(createTableQuery);
        console.log('Users table created or already exists.');

        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initDb();
