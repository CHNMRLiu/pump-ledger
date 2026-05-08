#!/usr/bin/env node
/**
 * import-data.js
 * 将 Excel 台账数据导入 SQLite 数据库
 *
 * 用法:
 *   node import-data.js              # 清空后导入（默认）
 *   node import-data.js --append     # 追加模式，不清空已有数据
 */

const XLSX = require('xlsx');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ── 配置 ──────────────────────────────────────────────
const EXCEL_PATH = path.resolve(__dirname, '..', '2026年水泵厂台账.xlsx');
const DB_DIR = path.resolve(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'ledger.db');

const isAppend = process.argv.includes('--append');

// ── 工具函数 ──────────────────────────────────────────

/**
 * Excel 日期序列号 → YYYY-MM-DD
 * Excel 以 1899-12-30 为基准（序列号 0）
 * 同时兼容已经是 Date 对象或字符串的情况
 */
function excelDateToISO(value) {
  if (value == null || value === '') return null;

  // 已经是 Date 对象
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 数字（Excel 序列号）
  if (typeof value === 'number') {
    // Excel 基准: 1899-12-30 = 序列号 0
    // 注意：Excel 有 1900 年 2 月 29 日 bug，序列号 >= 60 需要减 1
    let serial = value;
    if (serial >= 60) serial -= 1; // 修正 Excel 1900 bug
    const epoch = new Date(1899, 11, 30); // 1899-12-30
    const date = new Date(epoch.getTime() + serial * 86400000);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 字符串 — 尝试解析
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    // 已经是 YYYY-MM-DD 格式
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    // 尝试解析为数字
    const num = Number(trimmed);
    if (!isNaN(num)) return excelDateToISO(num);
    return trimmed;
  }

  return String(value);
}

/**
 * 数值清洗：空字符串或无效值 → null/0
 */
function cleanNumber(value, defaultVal = 0) {
  if (value == null || value === '') return defaultVal;
  const num = Number(value);
  return isNaN(num) ? defaultVal : num;
}

function cleanString(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

// ── 表结构映射 ──────────────────────────────────────────
// Excel 列名 → 数据库字段名，以及类型处理

const SHEET_CONFIG = {
  '合同总表': {
    table: 'contracts',
    columnMap: {
      '序号':             { field: 'seq',             type: 'int' },
      '合同编号':         { field: 'contract_no',     type: 'str' },
      '合同名称':         { field: 'contract_name',   type: 'str' },
      '合同金额':         { field: 'amount',          type: 'num' },
      '采购金额':         { field: 'purchase_amount', type: 'num' },
      '签订日期':         { field: 'sign_date',       type: 'date' },
      '采购员':           { field: 'purchaser',       type: 'str' },
      '终止日期':         { field: 'end_date',        type: 'date' },
      '距离到期日\n天数':  { field: 'days_to_expire',  type: 'str' },
      '交货进度':         { field: 'delivery_progress', type: 'str' },
      '合同状态':         { field: 'status',          type: 'str' },
      '收款状态':         { field: 'payment_status',  type: 'str' },
      '发票编号':         { field: 'invoice_no',      type: 'str' },
      '发票':             { field: 'invoice',         type: 'str' },
      '开票日期':         { field: 'invoice_date',    type: 'date' },
      '开票金额':         { field: 'invoice_amount',  type: 'num' },
    },
    skipRow: (row) => {
      // 跳过空行和"合计"行
      const contractNo = row['合同编号'];
      return !contractNo || String(contractNo).trim() === '' || String(contractNo).trim() === '合计';
    }
  },

  '合同明细表': {
    table: 'contract_details',
    columnMap: {
      '合同号':         { field: 'contract_no',        type: 'str' },
      '项目':           { field: 'project_no',         type: 'str' },
      '物料编码':       { field: 'material_code',      type: 'str' },
      '物料名称':       { field: 'material_name',      type: 'str' },
      '单位':           { field: 'unit',               type: 'str' },
      '数量':           { field: 'quantity',           type: 'num' },
      '合同单价':       { field: 'unit_price',         type: 'num' },
      '总计\n（含税）':  { field: 'total_with_tax',     type: 'num' },
      '采购价':         { field: 'purchase_price',     type: 'num' },
      '总价':           { field: 'total_price',        type: 'num' },
      '采购合同号':     { field: 'purchase_contract_no', type: 'str' },
      '订货单位':       { field: 'supplier',           type: 'str' },
      '签订日期':       { field: 'sign_date',          type: 'date' },
      '交货情况':       { field: 'delivery_status',    type: 'str' },
      '交货期':         { field: 'delivery_date',      type: 'date' },
      '备注':           { field: 'remark',             type: 'str' },
    },
    skipRow: (row) => {
      const contractNo = row['合同号'];
      return !contractNo || String(contractNo).trim() === '' || String(contractNo).trim() === '合计';
    }
  },

  '合同采购登记本': {
    table: 'procurement_register',
    columnMap: {
      '序号':         { field: 'seq',              type: 'int' },
      '合同号':       { field: 'contract_no',      type: 'str' },
      '对应系统合同': { field: 'system_contract',  type: 'str' },
      '项目号':       { field: 'project_no',       type: 'str' },
      '合同状态':     { field: 'status',           type: 'str' },
      '经办人':       { field: 'handler',          type: 'str' },
      '采购单位':     { field: 'supplier',         type: 'str' },
      '货物名称':     { field: 'goods_name',       type: 'str' },
      '合同金额':     { field: 'amount',           type: 'num' },
      '付款日期':     { field: 'payment_date',     type: 'date' },
      '发货状态':     { field: 'shipping_status',  type: 'str' },
      '物流单号':     { field: 'tracking_no',      type: 'str' },
      '收票日期':     { field: 'receipt_date',     type: 'date' },
      '发票号':       { field: 'invoice_no',       type: 'str' },
      '发票金额':     { field: 'invoice_amount',   type: 'num' },
      '备注':         { field: 'remark',           type: 'str' },
    },
    skipRow: (row) => {
      const contractNo = row['合同号'];
      return !contractNo || String(contractNo).trim() === '';
    }
  },

  '提前采购清单': {
    table: 'advance_procurement',
    columnMap: {
      '日期':       { field: 'date',            type: 'date' },
      '申请人':     { field: 'applicant',       type: 'str' },
      '名称':       { field: 'name',            type: 'str' },
      '金额':       { field: 'amount',          type: 'num' },
      '合同号':     { field: 'contract_no',     type: 'str' },
      '合同情况':   { field: 'contract_status', type: 'str' },
      '系统合同号': { field: 'system_contract', type: 'str' },
      '项目号':     { field: 'project_no',      type: 'str' },
      '备注':       { field: 'remark',          type: 'str' },
    },
    skipRow: (row) => {
      const name = row['名称'];
      return !name || String(name).trim() === '';
    }
  },

  '报价管理': {
    table: 'quotations',
    columnMap: {
      '询价单号':   { field: 'inquiry_no',      type: 'str' },
      '询单类型':   { field: 'inquiry_type',    type: 'str' },
      '采购员':     { field: 'purchaser',       type: 'str' },
      '发布日期':   { field: 'publish_date',    type: 'date' },
      '截至日期':   { field: 'deadline',        type: 'date' },
      '报价日期':   { field: 'quote_date',      type: 'date' },
      '总报价':     { field: 'total_quote',     type: 'num' },
      '报价状态':   { field: 'quote_status',    type: 'str' },
      '中标金额':   { field: 'winning_amount',  type: 'num' },
      '中标合同号': { field: 'winning_contract', type: 'str' },
    },
    skipRow: (row) => {
      const inquiryNo = row['询价单号'];
      return !inquiryNo || String(inquiryNo).trim() === '';
    }
  },
};

// ── 主逻辑 ──────────────────────────────────────────

function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   水泵厂台账 Excel → SQLite 导入工具     ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log();

  // 检查 Excel 文件
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`❌ Excel 文件不存在: ${EXCEL_PATH}`);
    process.exit(1);
  }
  console.log(`📄 Excel: ${EXCEL_PATH}`);

  // 确保数据目录存在
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  console.log(`💾 数据库: ${DB_PATH}`);
  console.log(`📦 模式: ${isAppend ? '追加' : '清空后导入'}`);
  console.log();

  // 读取 Excel
  console.log('📖 正在读取 Excel 文件...');
  const workbook = XLSX.readFile(EXCEL_PATH, {
    cellDates: true,   // 将日期序列号转为 Date 对象
    cellNF: false,
    raw: false,
  });
  console.log(`   工作表: ${workbook.SheetNames.join(', ')}`);
  console.log();

  // 打开数据库
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 确保表存在（读取 db.js 的建表语句会更可靠，这里直接创建）
  ensureTables(db);

  const totalStats = {};

  for (const [sheetName, config] of Object.entries(SHEET_CONFIG)) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      console.warn(`⚠️  工作表 "${sheetName}" 不存在，跳过`);
      continue;
    }

    console.log(`━━━ 处理: ${sheetName} → ${config.table} ━━━`);

    // 转为 JSON（第一行作为 key）
    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: null,
      raw: true,  // 保持原始值以正确处理日期
    });

    // 筛选有效行
    const validRows = rows.filter(r => !config.skipRow(r));
    console.log(`   总行数: ${rows.length}, 有效行: ${validRows.length}`);

    if (!isAppend) {
      const deleted = db.prepare(`DELETE FROM ${config.table}`).run();
      console.log(`   🗑️  清空 ${config.table}: ${deleted.changes} 行已删除`);
    }

    // 构建 INSERT 语句
    const fields = Object.values(config.columnMap).map(m => m.field);
    const placeholders = fields.map(() => '?').join(', ');
    const insertSQL = `INSERT INTO ${config.table} (${fields.join(', ')}) VALUES (${placeholders})`;
    const insertStmt = db.prepare(insertSQL);

    let imported = 0;
    let skipped = 0;
    const errors = [];

    // 批量插入（事务）
    const insertMany = db.transaction((rows) => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const values = [];
          for (const [excelCol, mapping] of Object.entries(config.columnMap)) {
            let val = row[excelCol];
            switch (mapping.type) {
              case 'date':
                val = excelDateToISO(val);
                break;
              case 'num':
                val = cleanNumber(val);
                break;
              case 'int':
                val = cleanNumber(val, null);
                if (val !== null) val = Math.round(val);
                break;
              case 'str':
              default:
                val = cleanString(val);
                break;
            }
            values.push(val);
          }
          insertStmt.run(...values);
          imported++;
        } catch (err) {
          skipped++;
          if (errors.length < 5) {
            errors.push({ row: i + 2, error: err.message }); // +2 因为 Excel 行号从 1 开始，且跳过表头
          }
        }
      }
    });

    const startTime = Date.now();
    insertMany(validRows);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`   ✅ 导入: ${imported} 行, 跳过: ${skipped} 行, 耗时: ${elapsed}s`);

    if (errors.length > 0) {
      console.log(`   ⚠️  前 ${errors.length} 个错误:`);
      errors.forEach(e => console.log(`      行 ${e.row}: ${e.error}`));
    }

    totalStats[config.table] = { imported, skipped, total: validRows.length };
    console.log();
  }

  // 汇总
  console.log('═══════════════════════════════════════════');
  console.log('📊 导入汇总:');
  console.log('───────────────────────────────────────────');
  let totalImported = 0;
  for (const [table, stats] of Object.entries(totalStats)) {
    console.log(`   ${table}: ${stats.imported}/${stats.total} 行`);
    totalImported += stats.imported;
  }
  console.log('───────────────────────────────────────────');
  console.log(`   总计: ${totalImported} 行已导入`);
  console.log('═══════════════════════════════════════════');

  // 验证
  console.log();
  console.log('🔍 验证数据库:');
  for (const config of Object.values(SHEET_CONFIG)) {
    const count = db.prepare(`SELECT COUNT(*) as cnt FROM ${config.table}`).get();
    console.log(`   ${config.table}: ${count.cnt} 行`);
  }

  db.close();
  console.log();
  console.log('✅ 导入完成！');
}

/**
 * 确保数据库表存在
 */
function ensureTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'purchaser',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seq INTEGER,
      contract_no TEXT UNIQUE,
      contract_name TEXT,
      amount REAL DEFAULT 0,
      purchase_amount REAL DEFAULT 0,
      sign_date TEXT,
      purchaser TEXT,
      end_date TEXT,
      days_to_expire TEXT,
      delivery_progress TEXT,
      status TEXT DEFAULT '进行中',
      payment_status TEXT DEFAULT '未开票',
      invoice_no TEXT,
      invoice TEXT,
      invoice_date TEXT,
      invoice_amount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contract_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_no TEXT,
      project_no TEXT,
      material_code TEXT,
      material_name TEXT,
      unit TEXT,
      quantity REAL DEFAULT 0,
      unit_price REAL DEFAULT 0,
      total_with_tax REAL DEFAULT 0,
      purchase_price REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      purchase_contract_no TEXT,
      supplier TEXT,
      sign_date TEXT,
      delivery_status TEXT,
      delivery_date TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS procurement_register (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seq INTEGER,
      contract_no TEXT,
      system_contract TEXT,
      project_no TEXT,
      status TEXT DEFAULT '进行中',
      handler TEXT,
      supplier TEXT,
      goods_name TEXT,
      amount REAL DEFAULT 0,
      payment_date TEXT,
      shipping_status TEXT DEFAULT '未发货',
      tracking_no TEXT,
      receipt_date TEXT,
      invoice_no TEXT,
      invoice_amount REAL DEFAULT 0,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS advance_procurement (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      applicant TEXT,
      name TEXT,
      amount REAL DEFAULT 0,
      contract_no TEXT,
      contract_status TEXT,
      system_contract TEXT,
      project_no TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_no TEXT UNIQUE,
      inquiry_type TEXT,
      purchaser TEXT,
      publish_date TEXT,
      deadline TEXT,
      quote_date TEXT,
      total_quote REAL DEFAULT 0,
      quote_status TEXT,
      winning_amount REAL DEFAULT 0,
      winning_contract TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// ── 执行 ──────────────────────────────────────────
main();
