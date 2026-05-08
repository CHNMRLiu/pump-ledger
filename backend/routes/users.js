const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All routes require auth + admin
router.use(authMiddleware, adminOnly);

// GET /api/users
router.get('/', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, name, role, created_at FROM users ORDER BY id').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: '服务器错误: ' + err.message });
  }
});

// POST /api/users
router.post('/', (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ error: '用户名、密码和姓名不能为空' });
    }
    if (!['admin', 'purchaser', 'finance', 'viewer'].includes(role)) {
      return res.status(400).json({ error: '角色无效' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashed = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)').run(username, hashed, name, role || 'purchaser');
    res.json({ id: result.lastInsertRowid, username, name, role: role || 'purchaser' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误: ' + err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, name, role } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (role && !['admin', 'purchaser', 'finance', 'viewer'].includes(role)) {
      return res.status(400).json({ error: '角色无效' });
    }

    if (username && username !== user.username) {
      const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, id);
      if (existing) {
        return res.status(400).json({ error: '用户名已存在' });
      }
    }

    const updates = [];
    const params = [];
    if (username) { updates.push('username = ?'); params.push(username); }
    if (password) { updates.push('password = ?'); params.push(bcrypt.hashSync(password, 10)); }
    if (name) { updates.push('name = ?'); params.push(name); }
    if (role) { updates.push('role = ?'); params.push(role); }

    if (updates.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' });
    }

    params.push(id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误: ' + err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    if (user.role === 'admin') {
      const adminCount = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'").get().cnt;
      if (adminCount <= 1) {
        return res.status(400).json({ error: '不能删除最后一个管理员' });
      }
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误: ' + err.message });
  }
});

module.exports = router;
