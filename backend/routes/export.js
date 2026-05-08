const express = require('express');
const ExcelJS = require('exceljs');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const TABLE_LABELS = {
  contracts: '合同总表',
  contract_details: '合同明细表',
  procurement_register: '合同采购登记本',
  advance_procurement: '提前采购清单',
  quotations: '报价管理'
};

const TABLE_COLUMNS = {
  contracts: [
    { header: '序号', key: 'seq' },
    { header: '合同编号', key: 'contract_no' },
    { header: '合同名称', key: 'contract_name' },
    { header: '金额', key: 'amount' },
    { header: '采购金额', key: 'purchase_amount' },
    { header: '签订日期', key: 'sign_date' },
    { header: '采购员', key: 'purchaser' },
    { header: '截止日期', key: 'end_date' },
    { header: '距到期天数', key: 'days_to_expire' },
    { header: '送货进度', key: 'delivery_progress' },
    { header: '状态', key: 'status' },
    { header: '付款状态', key: 'payment_status' },
    { header: '发票号', key: 'invoice_no' },
    { header: '发票', key: 'invoice' },
    { header: '开票日期', key: 'invoice_date' },
    { header: '开票金额', key: 'invoice_amount' }
  ],
  contract_details: [
    { header: '合同编号', key: 'contract_no' },
    { header: '项目编号', key: 'project_no' },
    { header: '物料编码', key: 'material_code' },
    { header: '物料名称', key: 'material_name' },
    { header: '单位', key: 'unit' },
    { header: '数量', key: 'quantity' },
    { header: '单价', key: 'unit_price' },
    { header: '含税合计', key: 'total_with_tax' },
    { header: '采购价', key: 'purchase_price' },
    { header: '总价', key: 'total_price' },
    { header: '采购合同编号', key: 'purchase_contract_no' },
    { header: '供应商', key: 'supplier' },
    { header: '签订日期', key: 'sign_date' },
    { header: '送货状态', key: 'delivery_status' },
    { header: '送货日期', key: 'delivery_date' },
    { header: '备注', key: 'remark' }
  ],
  procurement_register: [
    { header: '序号', key: 'seq' },
    { header: '合同编号', key: 'contract_no' },
    { header: '系统合同', key: 'system_contract' },
    { header: '项目编号', key: 'project_no' },
    { header: '状态', key: 'status' },
    { header: '经办人', key: 'handler' },
    { header: '供应商', key: 'supplier' },
    { header: '货物名称', key: 'goods_name' },
    { header: '金额', key: 'amount' },
    { header: '付款日期', key: 'payment_date' },
    { header: '发货状态', key: 'shipping_status' },
    { header: '物流单号', key: 'tracking_no' },
    { header: '收货日期', key: 'receipt_date' },
    { header: '发票号', key: 'invoice_no' },
    { header: '发票金额', key: 'invoice_amount' },
    { header: '备注', key: 'remark' }
  ],
  advance_procurement: [
    { header: '日期', key: 'date' },
    { header: '申请人', key: 'applicant' },
    { header: '名称', key: 'name' },
    { header: '金额', key: 'amount' },
    { header: '合同编号', key: 'contract_no' },
    { header: '合同状态', key: 'contract_status' },
    { header: '系统合同', key: 'system_contract' },
    { header: '项目编号', key: 'project_no' },
    { header: '备注', key: 'remark' }
  ],
  quotations: [
    { header: '询价单号', key: 'inquiry_no' },
    { header: '询价类型', key: 'inquiry_type' },
    { header: '采购员', key: 'purchaser' },
    { header: '发布日期', key: 'publish_date' },
    { header: '截止日期', key: 'deadline' },
    { header: '报价日期', key: 'quote_date' },
    { header: '报价总额', key: 'total_quote' },
    { header: '报价状态', key: 'quote_status' },
    { header: '中标金额', key: 'winning_amount' },
    { header: '中标合同', key: 'winning_contract' }
  ]
};

function createExportRouter(tableName) {
  const router = express.Router();

  router.get('/', authMiddleware, async (req, res) => {
    try {
      const rows = db.prepare(`SELECT * FROM ${tableName} ORDER BY id`).all();
      const workbook = new ExcelJS.Workbook();
      workbook.creator = '水泵厂台账管理系统';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet(TABLE_LABELS[tableName] || tableName);

      // Add columns
      const columns = TABLE_COLUMNS[tableName] || [];
      sheet.columns = columns.map(col => ({
        header: col.header,
        key: col.key,
        width: Math.max(col.header.length * 2, 12)
      }));

      // Style header
      sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Add data
      for (const row of rows) {
        const rowData = {};
        for (const col of columns) {
          rowData[col.key] = row[col.key] ?? '';
        }
        sheet.addRow(rowData);
      }

      // Auto filter
      if (rows.length > 0) {
        sheet.autoFilter = {
          from: { row: 1, column: 1 },
          to: { row: 1, column: columns.length }
        };
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(TABLE_LABELS[tableName] || tableName)}.xlsx"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      res.status(500).json({ error: '导出失败: ' + err.message });
    }
  });

  return router;
}

module.exports = { createExportRouter };
