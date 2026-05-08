const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const { createCrudRouter, createImportRouter } = require('./routes/crud');
const { createExportRouter } = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize default admin
function initAdmin() {
  const existing = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
  if (!existing) {
    const hashed = bcrypt.hashSync('admin123', 10);
    db.prepare("INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)").run('admin', hashed, '管理员', 'admin');
    console.log('默认管理员账号已创建: admin / admin123');
  }
}

initAdmin();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// CRUD routes for each table
const tables = ['contracts', 'contract_details', 'procurement_register', 'advance_procurement', 'quotations'];
for (const table of tables) {
  app.use(`/api/${table}`, createCrudRouter(table));
  app.use(`/api/${table}/export`, createExportRouter(table));
  app.use(`/api/import/${table}`, createImportRouter(table));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`水泵厂台账管理系统后端已启动，端口: ${PORT}`);
});
