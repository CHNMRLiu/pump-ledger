const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    // Total contracts
    const totalContracts = db.prepare('SELECT COUNT(*) as cnt FROM contracts').get().cnt;

    // Invoiced contracts
    const invoicedContracts = db.prepare("SELECT COUNT(*) as cnt FROM contracts WHERE invoice_no IS NOT NULL AND invoice_no != ''").get().cnt;

    // Total sales amount
    const totalAmount = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM contracts').get().total;

    // Uninvoiced amount
    const uninvoicedAmount = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM contracts WHERE invoice_no IS NULL OR invoice_no = ''").get().total;

    // Unordered count (contracts without procurement)
    const unorderedCount = db.prepare(`
      SELECT COUNT(*) as cnt FROM contracts c
      WHERE NOT EXISTS (SELECT 1 FROM procurement_register p WHERE p.contract_no = c.contract_no)
    `).get().cnt;

    // Status distribution
    const statusStats = db.prepare(`
      SELECT status, COUNT(*) as cnt FROM contracts GROUP BY status
    `).all();

    // Payment status distribution
    const paymentStats = db.prepare(`
      SELECT payment_status, COUNT(*) as cnt FROM contracts GROUP BY payment_status
    `).all();

    // By purchaser
    const purchaserStats = db.prepare(`
      SELECT purchaser, COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total_amount
      FROM contracts WHERE purchaser IS NOT NULL AND purchaser != ''
      GROUP BY purchaser ORDER BY total_amount DESC
    `).all();

    // Monthly trend (by sign_date)
    const monthlyTrend = db.prepare(`
      SELECT
        SUBSTR(sign_date, 1, 7) as month,
        COUNT(*) as cnt,
        COALESCE(SUM(amount), 0) as amount
      FROM contracts
      WHERE sign_date IS NOT NULL AND sign_date != ''
      GROUP BY SUBSTR(sign_date, 1, 7)
      ORDER BY month DESC
      LIMIT 12
    `).all().reverse();

    // Procurement status
    const procurementStats = db.prepare(`
      SELECT status, COUNT(*) as cnt FROM procurement_register GROUP BY status
    `).all();

    // Shipping status
    const shippingStats = db.prepare(`
      SELECT shipping_status, COUNT(*) as cnt FROM procurement_register GROUP BY shipping_status
    `).all();

    // Quotation stats
    const quoteStats = db.prepare(`
      SELECT quote_status, COUNT(*) as cnt FROM quotations WHERE quote_status IS NOT NULL GROUP BY quote_status
    `).all();

    res.json({
      totalContracts,
      invoicedContracts,
      totalAmount: Math.round(totalAmount * 100) / 100,
      uninvoicedAmount: Math.round(uninvoicedAmount * 100) / 100,
      unorderedCount,
      statusStats,
      paymentStats,
      purchaserStats,
      monthlyTrend,
      procurementStats,
      shippingStats,
      quoteStats
    });
  } catch (err) {
    res.status(500).json({ error: '服务器错误: ' + err.message });
  }
});

module.exports = router;
