const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'pump-ledger-secret-key-2026';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录，请先登录' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '权限不足，需要管理员权限' });
  }
  next();
}

function financeOrAdmin(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'finance') {
    return res.status(403).json({ error: '权限不足' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly, financeOrAdmin, JWT_SECRET };
