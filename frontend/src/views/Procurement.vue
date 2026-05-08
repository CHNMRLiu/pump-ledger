<template>
  <DataTable ref="tableRef" table="procurement_register" :defaultForm="defaultForm" ownerField="handler">
    <template #columns>
      <el-table-column prop="seq" label="序号" width="70" sortable="custom" />
      <el-table-column prop="contract_no" label="合同编号" min-width="130" sortable="custom" show-overflow-tooltip />
      <el-table-column prop="system_contract" label="系统合同" min-width="120" show-overflow-tooltip />
      <el-table-column prop="project_no" label="项目编号" min-width="120" sortable="custom" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="90" sortable="custom">
        <template #default="{ row }">
          <el-tag :type="row.status === '已完成' ? 'success' : row.status === '已取消' ? 'danger' : 'primary'" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="handler" label="经办人" width="90" sortable="custom" />
      <el-table-column prop="supplier" label="供应商" min-width="120" show-overflow-tooltip />
      <el-table-column prop="goods_name" label="货物名称" min-width="130" show-overflow-tooltip />
      <el-table-column prop="amount" label="金额" width="110" sortable="custom" align="right">
        <template #default="{ row }">{{ formatNum(row.amount) }}</template>
      </el-table-column>
      <el-table-column prop="payment_date" label="付款日期" width="110" sortable="custom" />
      <el-table-column prop="shipping_status" label="发货状态" width="100" sortable="custom">
        <template #default="{ row }">
          <el-tag :type="row.shipping_status === '已发货' ? 'success' : row.shipping_status === '部分发货' ? 'warning' : 'info'" size="small">{{ row.shipping_status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="tracking_no" label="物流单号" min-width="130" show-overflow-tooltip />
      <el-table-column prop="receipt_date" label="收货日期" width="110" />
      <el-table-column prop="invoice_no" label="发票号" width="120" show-overflow-tooltip />
      <el-table-column prop="invoice_amount" label="发票金额" width="110" align="right">
        <template #default="{ row }">{{ formatNum(row.invoice_amount) }}</template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
    </template>

    <template #form="{ form }">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="序号"><el-input-number v-model="form.seq" :controls="false" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="合同编号"><el-input v-model="form.contract_no" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="系统合同"><el-input v-model="form.system_contract" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="项目编号"><el-input v-model="form.project_no" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态">
            <el-select v-model="form.status" style="width: 100%">
              <el-option label="进行中" value="进行中" />
              <el-option label="已完成" value="已完成" />
              <el-option label="已取消" value="已取消" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="经办人"><el-input v-model="form.handler" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="供应商"><el-input v-model="form.supplier" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="货物名称"><el-input v-model="form.goods_name" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="金额"><el-input-number v-model="form.amount" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="付款日期"><el-date-picker v-model="form.payment_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发货状态">
            <el-select v-model="form.shipping_status" style="width: 100%">
              <el-option label="未发货" value="未发货" />
              <el-option label="部分发货" value="部分发货" />
              <el-option label="已发货" value="已发货" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="物流单号"><el-input v-model="form.tracking_no" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="收货日期"><el-date-picker v-model="form.receipt_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发票号"><el-input v-model="form.invoice_no" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发票金额"><el-input-number v-model="form.invoice_amount" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
        </el-col>
      </el-row>
    </template>
  </DataTable>
</template>

<script setup>
import DataTable from '../components/DataTable.vue'

const defaultForm = {
  seq: null, contract_no: '', system_contract: '', project_no: '', status: '进行中',
  handler: '', supplier: '', goods_name: '', amount: 0, payment_date: '',
  shipping_status: '未发货', tracking_no: '', receipt_date: '', invoice_no: '', invoice_amount: 0, remark: ''
}

function formatNum(val) {
  if (!val && val !== 0) return ''
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>
