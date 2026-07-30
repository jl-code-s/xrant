import 'dotenv/config';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'xrant',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
});

const schema = `
CREATE TABLE IF NOT EXISTS rants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  code VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rant_id INT NOT NULL,
  parent_id INT DEFAULT NULL,
  username VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rant_id) REFERENCES rants(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rant_id INT DEFAULT NULL,
  comment_id INT DEFAULT NULL,
  username VARCHAR(100) NOT NULL,
  reason VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_report (rant_id, comment_id, username),
  FOREIGN KEY (rant_id) REFERENCES rants(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rant_id INT DEFAULT NULL,
  comment_id INT DEFAULT NULL,
  username VARCHAR(100) NOT NULL,
   type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   UNIQUE KEY unique_reaction (rant_id, comment_id, username),
  FOREIGN KEY (rant_id) REFERENCES rants(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

async function initDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
    multipleStatements: true,
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'xrant'}\`;`);
  await connection.query(`USE \`${process.env.DB_NAME || 'xrant'}\`;`);
  await connection.query(schema);
  console.log('Database initialized');
  await connection.end();
}

export { pool, initDB };

// Run directly: node db.js
if (process.argv[1] && process.argv[1].endsWith('db.js')) {
  initDB().catch((err) => {
    console.error('DB init failed:', err);
    process.exit(1);
  });
}
