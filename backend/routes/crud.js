const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// Table definitions: columns and their types
const TABLE_DEFS = {
  contracts: {
    columns: ['seq', 'contract_no', 'contract_name', 'amount', 'purchase_amount', 'sign_date', 'purchaser', 'end_date', 'days_to_expire', 'delivery_progress', 'status', 'payment_status', 'invoice_no', 'invoice', 'invoice_date', 'invoice_amount'],
    uniqueField: 'contract_no',
    ownerField: 'purchaser',
    financeFields: ['invoice_no', 'invoice', 'invoice_date', 'invoice_amount', 'payment_status'],
    dateFields: ['sign_date', 'end_date', 'invoice_date'],
    numberFields: ['amount', 'purchase_amount', 'invoice_amount']
  },
  contract_details: {
    columns: ['contract_no', 'project_no', 'material_code', 'material_name', 'unit', 'quantity', 'unit_price', 'total_with_tax', 'purchase_price', 'total_price', 'purchase_contract_no', 'supplier', 'sign_date', 'delivery_status', 'delivery_date', 'remark'],
    ownerField: null,
    financeFields: [],
    dateFields: ['sign_date', 'delivery_date'],
    numberFields: ['quantity', 'unit_price', 'total_with_tax', 'purchase_price', 'total_price']
  },
  procurement_register: {
    columns: ['seq', 'contract_no', 'system_contract', 'project_no', 'status', 'handler', 'supplier', 'goods_name', 'amount', 'payment_date', 'shipping_status', 'tracking_no', 'receipt_date', 'invoice_no', 'invoice_amount', 'remark'],
    ownerField: 'handler',
    financeFields: ['invoice_no', 'invoice_amount', 'payment_date'],
    dateFields: ['payment_date', 'receipt_date'],
    numberFields: ['amount', 'invoice_amount']
  },
  advance_procurement: {
    columns: ['date', 'applicant', 'name', 'amount', 'contract_no', 'contract_status', 'system_contract', 'project_no', 'remark'],
    ownerField: 'applicant',
    financeFields: [],
    dateFields: ['date'],
    numberFields: ['amount']
  },
  quotations: {
    columns: ['inquiry_no', 'inquiry_type', 'purchaser', 'publish_date', 'deadline', 'quote_date', 'total_quote', 'quote_status', 'winning_amount', 'winning_contract'],
    uniqueField: 'inquiry_no',
    ownerField: 'purchaser',
    financeFields: [],
    dateFields: ['publish_date', 'deadline', 'quote_date'],
    numberFields: ['total_quote', 'winning_amount']
  }
};

function createCrudRouter(tableName) {
  const router = express.Router();
  const def = TABLE_DEFS[tableName];

  if (!def) {
    throw new Error(`Unknown table: ${tableName}`);
  }

  router.use(authMiddleware);

  // GET / - list with pagination, search, filter, sort
  router.get('/', (req, res) => {
    try {
      const { page = 1, pageSize = 20, search, sort, order, ...filters } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const limit = parseInt(pageSize);

      let whereClauses = [];
      let params = [];

      // Global search across all text columns
      if (search) {
        const searchClauses = def.columns.map(col => `CAST(${col} AS TEXT) LIKE ?`);
        whereClauses.push(`(${searchClauses.join(' OR ')})`);
        for (let i = 0; i < def.columns.length; i++) {
          params.push(`%${search}%`);
        }
      }

      // Per-column filters
      for (const [key, value] of Object.entries(filters)) {
        if (def.columns.includes(key) && value !== '' && value !== undefined) {
          if (def.dateFields.includes(key)) {
            whereClauses.push(`${key} = ?`);
            params.push(value);
          } else if (def.numberFields.includes(key)) {
            whereClauses.push(`${key} = ?`);
            params.push(parseFloat(value));
          } else {
            whereClauses.push(`${key} LIKE ?`);
            params.push(`%${value}%`);
          }
        }
      }

      // Role-based filtering for purchaser
      if (req.user.role === 'purchaser' && def.ownerField) {
        whereClauses.push(`${def.ownerField} = ?`);
        params.push(req.user.name);
      }

      const where = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

      // Sort
      let orderBy = 'ORDER BY id DESC';
      if (sort && def.columns.includes(sort)) {
        const dir = order === 'asc' ? 'ASC' : 'DESC';
        orderBy = `ORDER BY ${sort} ${dir}`;
      }

      const countSql = `SELECT COUNT(*) as total FROM ${tableName} ${where}`;
      const total = db.prepare(countSql).get(...params).total;

      const dataSql = `SELECT * FROM ${tableName} ${where} ${orderBy} LIMIT ? OFFSET ?`;
      const data = db.prepare(dataSql).all(...params, limit, offset);

      res.json({ data, total, page: parseInt(page), pageSize: limit });
    } catch (err) {
      res.status(500).json({ error: '服务器错误: ' + err.message });
    }
  });

  // GET /:id
  router.get('/:id', (req, res) => {
    try {
      const row = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(req.params.id);
      if (!row) return res.status(404).json({ error: '记录不存在' });
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: '服务器错误: ' + err.message });
    }
  });

  // POST /
  router.post('/', (req, res) => {
    try {
      const data = {};
      for (const col of def.columns) {
        if (req.body[col] !== undefined) {
          data[col] = req.body[col];
        }
      }

      if (def.uniqueField && data[def.uniqueField]) {
        const existing = db.prepare(`SELECT id FROM ${tableName} WHERE ${def.uniqueField} = ?`).get(data[def.uniqueField]);
        if (existing) {
          return res.status(400).json({ error: `${def.uniqueField} 已存在` });
        }
      }

      const cols = Object.keys(data);
      const vals = Object.values(data);
      const placeholders = cols.map(() => '?').join(', ');
      const sql = `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`;
      const result = db.prepare(sql).run(...vals);
      res.json({ id: result.lastInsertRowid, ...data });
    } catch (err) {
      res.status(500).json({ error: '服务器错误: ' + err.message });
    }
  });

  // PUT /:id
  router.put('/:id', (req, res) => {
    try {
      const existing = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(req.params.id);
      if (!existing) return res.status(404).json({ error: '记录不存在' });

      // Permission check for purchaser
      if (req.user.role === 'purchaser' && def.ownerField) {
        if (existing[def.ownerField] !== req.user.name) {
          return res.status(403).json({ error: '只能编辑自己的数据' });
        }
        // Purchaser can't edit finance fields
        for (const f of def.financeFields) {
          if (req.body[f] !== undefined && req.body[f] !== existing[f]) {
            return res.status(403).json({ error: `无权修改 ${f} 字段` });
          }
        }
      }

      // Finance can only edit finance fields
      if (req.user.role === 'finance' && def.financeFields.length > 0) {
        const allowedFields = [...def.financeFields];
        for (const key of Object.keys(req.body)) {
          if (def.columns.includes(key) && !allowedFields.includes(key) && key !== 'id') {
            if (req.body[key] !== existing[key]) {
              return res.status(403).json({ error: `无权修改 ${key} 字段` });
            }
          }
        }
      }

      // Viewer can't edit
      if (req.user.role === 'viewer') {
        return res.status(403).json({ error: '查看者无权编辑' });
      }

      const updates = [];
      const params = [];
      for (const col of def.columns) {
        if (req.body[col] !== undefined) {
          updates.push(`${col} = ?`);
          params.push(req.body[col]);
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: '没有需要更新的字段' });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(req.params.id);

      // Unique check
      if (def.uniqueField && req.body[def.uniqueField]) {
        const dup = db.prepare(`SELECT id FROM ${tableName} WHERE ${def.uniqueField} = ? AND id != ?`).get(req.body[def.uniqueField], req.params.id);
        if (dup) {
          return res.status(400).json({ error: `${def.uniqueField} 已存在` });
        }
      }

      db.prepare(`UPDATE ${tableName} SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      res.json({ message: '更新成功' });
    } catch (err) {
      res.status(500).json({ error: '服务器错误: ' + err.message });
    }
  });

  // DELETE /:id (admin only)
  router.delete('/:id', (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: '只有管理员可以删除' });
      }
      const existing = db.prepare(`SELECT id FROM ${tableName} WHERE id = ?`).get(req.params.id);
      if (!existing) return res.status(404).json({ error: '记录不存在' });
      db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(req.params.id);
      res.json({ message: '删除成功' });
    } catch (err) {
      res.status(500).json({ error: '服务器错误: ' + err.message });
    }
  });

  return router;
}

// Import endpoint
function createImportRouter(tableName) {
  const router = express.Router();
  const def = TABLE_DEFS[tableName];
  if (!def) throw new Error(`Unknown table: ${tableName}`);

  router.post('/', authMiddleware, (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: '只有管理员可以导入' });
      }
      const rows = req.body;
      if (!Array.isArray(rows)) {
        return res.status(400).json({ error: '需要传入数组' });
      }

      const cols = def.columns;
      const placeholders = cols.map(() => '?').join(', ');
      const sql = `INSERT OR REPLACE INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`;
      const insert = db.prepare(sql);

      let imported = 0;
      const insertMany = db.transaction((items) => {
        for (const item of items) {
          const vals = cols.map(c => item[c] ?? null);
          insert.run(...vals);
          imported++;
        }
      });

      insertMany(rows);
      res.json({ message: `成功导入 ${imported} 条记录` });
    } catch (err) {
      res.status(500).json({ error: '导入失败: ' + err.message });
    }
  });

  return router;
}

module.exports = { createCrudRouter, createImportRouter, TABLE_DEFS };
