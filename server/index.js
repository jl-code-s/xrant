import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, initDB } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

await initDB();

// --- RANTS ---

app.get('/api/rants', async (req, res) => {
  try {
    const { code } = req.query;
    let sql = `
      SELECT r.*,
        (SELECT COUNT(*)::int FROM comments WHERE rant_id = r.id) AS comment_count
      FROM rants r WHERE r.archived = false`;
    const params = [];
    if (code?.trim()) {
      sql += ' AND r.code ILIKE $1';
      params.push(`%${code.trim()}%`);
    }
    sql += ' ORDER BY r.created_at DESC';
    const result = await pool.query(sql, params);
    const rants = result.rows;
    for (const rant of rants) {
      const res2 = await pool.query(
        'SELECT type, COUNT(*)::int AS count FROM reactions WHERE rant_id = $1 GROUP BY type',
        [rant.id]
      );
      const types = ['like', 'dislike', 'heart', 'care', 'angry', 'sad', 'happy'];
      for (const t of types) rant[t] = 0;
      for (const r of res2.rows) rant[r.type] = r.count;
    }
    res.json(rants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rants', async (req, res) => {
  try {
    const { username, content, code } = req.body;
    if (!username?.trim() || !content?.trim())
      return res.status(400).json({ error: 'Username and content are required' });
    const result = await pool.query(
      'INSERT INTO rants (username, content, code) VALUES ($1, $2, $3) RETURNING *',
      [username.trim(), content.trim(), code?.trim() || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rants/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM rants WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- COMMENTS ---

app.get('/api/rants/:id/comments', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM comments WHERE rant_id = $1 AND archived = false ORDER BY created_at ASC',
      [req.params.id]
    );
    const comments = result.rows;
    for (const comment of comments) {
      const res2 = await pool.query(
        'SELECT type, COUNT(*)::int AS count FROM reactions WHERE comment_id = $1 GROUP BY type',
        [comment.id]
      );
      const types = ['like', 'dislike', 'heart', 'care', 'angry', 'sad', 'happy'];
      for (const t of types) comment[t] = 0;
      for (const r of res2.rows) comment[r.type] = r.count;
    }
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rants/:id/comments', async (req, res) => {
  try {
    const { username, content, parent_id } = req.body;
    if (!username?.trim() || !content?.trim())
      return res.status(400).json({ error: 'Username and content are required' });
    const result = await pool.query(
      'INSERT INTO comments (rant_id, parent_id, username, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, parent_id || null, username.trim(), content.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM comments WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- REPORTS ---

app.post('/api/rants/:id/report', async (req, res) => {
  try {
    const { username, reason } = req.body;
    if (!username?.trim())
      return res.status(400).json({ error: 'Username is required' });
    const existing = await pool.query(
      'SELECT id FROM reports WHERE rant_id = $1 AND comment_id IS NULL AND username = $2',
      [req.params.id, username.trim()]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'Already reported' });
    await pool.query(
      'INSERT INTO reports (rant_id, username, reason) VALUES ($1, $2, $3)',
      [req.params.id, username.trim(), reason || null]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/comments/:id/report', async (req, res) => {
  try {
    const { username, reason } = req.body;
    if (!username?.trim())
      return res.status(400).json({ error: 'Username is required' });
    const existing = await pool.query(
      'SELECT id FROM reports WHERE comment_id = $1 AND username = $2',
      [req.params.id, username.trim()]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'Already reported' });
    await pool.query(
      'INSERT INTO reports (comment_id, username, reason) VALUES ($1, $2, $3)',
      [req.params.id, username.trim(), reason || null]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN ---

app.get('/api/admin/reports', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT rp.*,
        r.content AS rant_content, r.username AS rant_username, r.created_at AS rant_created,
        c.content AS comment_content, c.username AS comment_username
      FROM reports rp
      LEFT JOIN rants r ON r.id = rp.rant_id
      LEFT JOIN comments c ON c.id = rp.comment_id
      ORDER BY rp.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/rants', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM rants ORDER BY archived ASC, created_at DESC'
    );
    const rants = result.rows;
    for (const rant of rants) {
      const res2 = await pool.query(
        'SELECT COUNT(*)::int AS count FROM comments WHERE rant_id = $1', [rant.id]
      );
      rant.comment_count = res2.rows[0].count;
    }
    res.json(rants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/rants/:id/archive', async (req, res) => {
  try {
    const { archived } = req.body;
    await pool.query('UPDATE rants SET archived = $1 WHERE id = $2', [archived, req.params.id]);
    res.json({ success: true, archived });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/comments/:id/archive', async (req, res) => {
  try {
    const { archived } = req.body;
    await pool.query('UPDATE comments SET archived = $1 WHERE id = $2', [archived, req.params.id]);
    res.json({ success: true, archived });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/comments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, r.content AS rant_content, r.username AS rant_username
      FROM comments c
      JOIN rants r ON r.id = c.rant_id
      ORDER BY c.archived ASC, c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/comments/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM comments WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- REACTIONS ---

app.post('/api/reactions', async (req, res) => {
  try {
    const { rant_id, comment_id, username, type } = req.body;
    if (!username?.trim() || !type || (!rant_id && !comment_id))
      return res.status(400).json({ error: 'Invalid reaction data' });

    const existing = await pool.query(
      'SELECT id, type FROM reactions WHERE rant_id IS NOT DISTINCT FROM $1 AND comment_id IS NOT DISTINCT FROM $2 AND username = $3',
      [rant_id || null, comment_id || null, username.trim()]
    );

    let currentUserType = null;
    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      if (row.type === type) {
        await pool.query('DELETE FROM reactions WHERE id = $1', [row.id]);
      } else {
        await pool.query('UPDATE reactions SET type = $1 WHERE id = $2', [type, row.id]);
        currentUserType = type;
      }
    } else {
      await pool.query(
        'INSERT INTO reactions (rant_id, comment_id, username, type) VALUES ($1, $2, $3, $4)',
        [rant_id || null, comment_id || null, username.trim(), type]
      );
      currentUserType = type;
    }

    const idField = rant_id ? 'rant_id' : 'comment_id';
    const idValue = rant_id || comment_id;
    const res2 = await pool.query(
      `SELECT type, COUNT(*)::int AS count FROM reactions WHERE ${idField} = $1 GROUP BY type`,
      [idValue]
    );
    const types = ['like', 'dislike', 'heart', 'care', 'angry', 'sad', 'happy'];
    const counts = {};
    for (const t of types) counts[t] = 0;
    for (const r of res2.rows) counts[r.type] = r.count;
    res.json({ counts, currentUserType });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
