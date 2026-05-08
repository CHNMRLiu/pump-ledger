<template>
  <DataTable ref="tableRef" table="contracts" :defaultForm="defaultForm" ownerField="purchaser">
    <template #columns>
      <el-table-column prop="seq" label="序号" width="70" sortable="custom" />
      <el-table-column prop="contract_no" label="合同编号" min-width="130" sortable="custom" show-overflow-tooltip />
      <el-table-column prop="contract_name" label="合同名称" min-width="180" sortable="custom" show-overflow-tooltip />
      <el-table-column prop="amount" label="金额" width="120" sortable="custom" align="right">
        <template #default="{ row }">{{ formatNum(row.amount) }}</template>
      </el-table-column>
      <el-table-column prop="purchase_amount" label="采购金额" width="120" sortable="custom" align="right">
        <template #default="{ row }">{{ formatNum(row.purchase_amount) }}</template>
      </el-table-column>
      <el-table-column prop="sign_date" label="签订日期" width="110" sortable="custom" />
      <el-table-column prop="purchaser" label="采购员" width="90" sortable="custom" />
      <el-table-column prop="end_date" label="截止日期" width="110" sortable="custom" />
      <el-table-column prop="days_to_expire" label="距到期天数" width="100" sortable="custom" />
      <el-table-column prop="delivery_progress" label="送货进度" width="100" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="90" sortable="custom">
        <template #default="{ row }">
          <el-tag :type="row.status === '已送货' ? 'success' : row.status === '已取消' ? 'danger' : 'primary'" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="payment_status" label="付款状态" width="90" sortable="custom">
        <template #default="{ row }">
          <el-tag :type="row.payment_status === '已收款' ? 'success' : row.payment_status === '已挂账' ? 'warning' : 'info'" size="small">{{ row.payment_status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="invoice_no" label="发票号" width="120" show-overflow-tooltip />
      <el-table-column prop="invoice_date" label="开票日期" width="110" />
      <el-table-column prop="invoice_amount" label="开票金额" width="110" align="right">
        <template #default="{ row }">{{ formatNum(row.invoice_amount) }}</template>
      </el-table-column>
    </template>

    <template #form="{ form }">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="序号"><el-input-number v-model="form.seq" :controls="false" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="合同编号"><el-input v-model="form.contract_no" /></el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="合同名称"><el-input v-model="form.contract_name" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="金额"><el-input-number v-model="form.amount" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="采购金额"><el-input-number v-model="form.purchase_amount" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="签订日期"><el-date-picker v-model="form.sign_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="采购员"><el-input v-model="form.purchaser" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="截止日期"><el-date-picker v-model="form.end_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="距到期天数"><el-input v-model="form.days_to_expire" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="送货进度"><el-input v-model="form.delivery_progress" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态">
            <el-select v-model="form.status" style="width: 100%">
              <el-option label="进行中" value="进行中" />
              <el-option label="已送货" value="已送货" />
              <el-option label="已取消" value="已取消" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="付款状态">
            <el-select v-model="form.payment_status" style="width: 100%">
              <el-option label="未开票" value="未开票" />
              <el-option label="已挂账" value="已挂账" />
              <el-option label="已收款" value="已收款" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发票号"><el-input v-model="form.invoice_no" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发票"><el-input v-model="form.invoice" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开票日期"><el-date-picker v-model="form.invoice_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开票金额"><el-input-number v-model="form.invoice_amount" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        </el-col>
      </el-row>
    </template>
  </DataTable>
</template>

<script setup>
import DataTable from '../components/DataTable.vue'

const defaultForm = {
  seq: null, contract_no: '', contract_name: '', amount: 0, purchase_amount: 0,
  sign_date: '', purchaser: '', end_date: '', days_to_expire: '', delivery_progress: '',
  status: '进行中', payment_status: '未开票', invoice_no: '', invoice: '', invoice_date: '', invoice_amount: 0
}

function formatNum(val) {
  if (!val && val !== 0) return ''
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>
