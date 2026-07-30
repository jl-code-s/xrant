import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '007622',
  database: process.env.DB_NAME || 'xrant',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false,
  },
});

const schemas = [
  `CREATE TABLE IF NOT EXISTS rants (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    code VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived BOOLEAN NOT NULL DEFAULT false
  )`,
  `CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    rant_id INTEGER NOT NULL REFERENCES rants(id) ON DELETE CASCADE,
    parent_id INTEGER DEFAULT NULL REFERENCES comments(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    rant_id INTEGER DEFAULT NULL REFERENCES rants(id) ON DELETE CASCADE,
    comment_id INTEGER DEFAULT NULL REFERENCES comments(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    reason VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (rant_id, comment_id, username)
  )`,
  `CREATE TABLE IF NOT EXISTS reactions (
    id SERIAL PRIMARY KEY,
    rant_id INTEGER DEFAULT NULL REFERENCES rants(id) ON DELETE CASCADE,
    comment_id INTEGER DEFAULT NULL REFERENCES comments(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (rant_id, comment_id, username)
  )`,
];

async function initDB() {
  const dbName = process.env.DB_NAME || 'xrant';
  const adminPool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '007622',
    database: 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
  });
  try {
    await adminPool.query(`CREATE DATABASE "${dbName}"`);
  } catch (e) {
    if (!e.message.includes('already exists')) throw e;
  }
  await adminPool.end();

  const conn = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '007622',
    database: dbName,
    port: parseInt(process.env.DB_PORT || '5432'),
  });
  for (const sql of schemas) {
    await conn.query(sql);
  }
  await conn.end();
  console.log('Database initialized');
}

export { pool, initDB };

if (process.argv[1] && process.argv[1].endsWith('db.js')) {
  initDB().catch((err) => {
    console.error('DB init failed:', err);
    process.exit(1);
  });
}
