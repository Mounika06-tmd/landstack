const { Pool } = require("pg");
const path = require("path");
const dotenv = require("dotenv");

// Explicitly load backend/.env
dotenv.config({
    path: path.join(__dirname, ".env")
});

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    // Neon PostgreSQL requires SSL
    ssl: process.env.DB_SSL === "true"
});

module.exports = pool;