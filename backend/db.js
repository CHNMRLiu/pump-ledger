const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'pump_ledger.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
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

module.exports = db;
