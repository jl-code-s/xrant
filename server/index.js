import express from 'express';
import cors from 'cors';
import { pool, initDB } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

await initDB();

// --- RANTS ---

app.get('/api/rants', async (req, res) => {
  try {
    const { code } = req.query;
    let sql = `
      SELECT r.*,
        (SELECT COUNT(*) FROM comments WHERE rant_id = r.id) AS comment_count
      FROM rants r WHERE r.archived = 0`;
    const params = [];
    if (code?.trim()) {
      sql += ' AND r.code LIKE ?';
      params.push(`%${code.trim()}%`);
    }
    sql += ' ORDER BY r.created_at DESC';
    const [rants] = await pool.query(sql, params);
    for (const rant of rants) {
      const [rows] = await pool.query(
        'SELECT type, COUNT(*) AS count FROM reactions WHERE rant_id = ? GROUP BY type',
        [rant.id]
      );
      const types = ['like', 'dislike', 'heart', 'care', 'angry', 'sad', 'happy'];
      for (const t of types) rant[t] = 0;
      for (const r of rows) rant[r.type] = r.count;
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
    const [result] = await pool.query(
      'INSERT INTO rants (username, content, code) VALUES (?, ?, ?)',
      [username.trim(), content.trim(), code?.trim() || null]
    );
    const [rant] = await pool.query('SELECT * FROM rants WHERE id = ?', [result.insertId]);
    res.status(201).json(rant[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rants/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM rants WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- COMMENTS ---

app.get('/api/rants/:id/comments', async (req, res) => {
  try {
    const [comments] = await pool.query(
      'SELECT * FROM comments WHERE rant_id = ? AND archived = 0 ORDER BY created_at ASC',
      [req.params.id]
    );
    for (const comment of comments) {
      const [rows] = await pool.query(
        'SELECT type, COUNT(*) AS count FROM reactions WHERE comment_id = ? GROUP BY type',
        [comment.id]
      );
      const types = ['like', 'dislike', 'heart', 'care', 'angry', 'sad', 'happy'];
      for (const t of types) comment[t] = 0;
      for (const r of rows) comment[r.type] = r.count;
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
    const [result] = await pool.query(
      'INSERT INTO comments (rant_id, parent_id, username, content) VALUES (?, ?, ?, ?)',
      [req.params.id, parent_id || null, username.trim(), content.trim()]
    );
    const [comment] = await pool.query('SELECT * FROM comments WHERE id = ?', [result.insertId]);
    res.status(201).json(comment[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
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
    const [existing] = await pool.query(
      'SELECT id FROM reports WHERE rant_id = ? AND comment_id IS NULL AND username = ?',
      [req.params.id, username.trim()]
    );
    if (existing.length > 0)
      return res.status(409).json({ error: 'Already reported' });
    await pool.query(
      'INSERT INTO reports (rant_id, username, reason) VALUES (?, ?, ?)',
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
    const [existing] = await pool.query(
      'SELECT id FROM reports WHERE comment_id = ? AND username = ?',
      [req.params.id, username.trim()]
    );
    if (existing.length > 0)
      return res.status(409).json({ error: 'Already reported' });
    await pool.query(
      'INSERT INTO reports (comment_id, username, reason) VALUES (?, ?, ?)',
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
    const [reports] = await pool.query(`
      SELECT rp.*,
        r.content AS rant_content, r.username AS rant_username, r.created_at AS rant_created,
        c.content AS comment_content, c.username AS comment_username
      FROM reports rp
      LEFT JOIN rants r ON r.id = rp.rant_id
      LEFT JOIN comments c ON c.id = rp.comment_id
      ORDER BY rp.created_at DESC
    `);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/rants', async (req, res) => {
  try {
    const [rants] = await pool.query(
      'SELECT * FROM rants ORDER BY archived ASC, created_at DESC'
    );
    for (const rant of rants) {
      rant.archived = !!rant.archived;
    }
    for (const rant of rants) {
      const [[{ count }]] = await pool.query(
        'SELECT COUNT(*) AS count FROM comments WHERE rant_id = ?', [rant.id]
      );
      rant.comment_count = count;
    }
    res.json(rants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/rants/:id/archive', async (req, res) => {
  try {
    const { archived } = req.body;
    await pool.query('UPDATE rants SET archived = ? WHERE id = ?', [archived ? 1 : 0, req.params.id]);
    res.json({ success: true, archived: !!archived });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/comments/:id/archive', async (req, res) => {
  try {
    const { archived } = req.body;
    await pool.query('UPDATE comments SET archived = ? WHERE id = ?', [archived ? 1 : 0, req.params.id]);
    res.json({ success: true, archived: !!archived });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/comments', async (req, res) => {
  try {
    const [comments] = await pool.query(`
      SELECT c.*, r.content AS rant_content, r.username AS rant_username
      FROM comments c
      JOIN rants r ON r.id = c.rant_id
      ORDER BY c.archived ASC, c.created_at DESC
    `);
    for (const comment of comments) {
      comment.archived = !!comment.archived;
    }
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/comments/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
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

    const [existing] = await pool.query(
      'SELECT id, type FROM reactions WHERE rant_id <=> ? AND comment_id <=> ? AND username = ?',
      [rant_id || null, comment_id || null, username.trim()]
    );

    let currentUserType = null;
    if (existing.length > 0) {
      const row = existing[0];
      if (row.type === type) {
        await pool.query('DELETE FROM reactions WHERE id = ?', [row.id]);
      } else {
        await pool.query('UPDATE reactions SET type = ? WHERE id = ?', [type, row.id]);
        currentUserType = type;
      }
    } else {
      await pool.query(
        'INSERT INTO reactions (rant_id, comment_id, username, type) VALUES (?, ?, ?, ?)',
        [rant_id || null, comment_id || null, username.trim(), type]
      );
      currentUserType = type;
    }

    const idField = rant_id ? 'rant_id' : 'comment_id';
    const idValue = rant_id || comment_id;
    const [rows] = await pool.query(
      `SELECT type, COUNT(*) AS count FROM reactions WHERE ${idField} = ? GROUP BY type`,
      [idValue]
    );
    const types = ['like', 'dislike', 'heart', 'care', 'angry', 'sad', 'happy'];
    const counts = {};
    for (const t of types) counts[t] = 0;
    for (const r of rows) counts[r.type] = r.count;
    res.json({ counts, currentUserType });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
