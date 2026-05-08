<template>
  <DataTable ref="tableRef" table="quotations" :defaultForm="defaultForm" ownerField="purchaser">
    <template #columns>
      <el-table-column prop="inquiry_no" label="询价单号" min-width="130" sortable="custom" show-overflow-tooltip />
      <el-table-column prop="inquiry_type" label="询价类型" width="100" sortable="custom" />
      <el-table-column prop="purchaser" label="采购员" width="100" sortable="custom" />
      <el-table-column prop="publish_date" label="发布日期" width="110" sortable="custom" />
      <el-table-column prop="deadline" label="截止日期" width="110" sortable="custom" />
      <el-table-column prop="quote_date" label="报价日期" width="110" sortable="custom" />
      <el-table-column prop="total_quote" label="报价总额" width="120" sortable="custom" align="right">
        <template #default="{ row }">{{ formatNum(row.total_quote) }}</template>
      </el-table-column>
      <el-table-column prop="quote_status" label="报价状态" width="100" sortable="custom">
        <template #default="{ row }">
          <el-tag v-if="row.quote_status" :type="row.quote_status === '已中标' ? 'success' : row.quote_status === '未中标' ? 'danger' : 'primary'" size="small">{{ row.quote_status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="winning_amount" label="中标金额" width="120" sortable="custom" align="right">
        <template #default="{ row }">{{ formatNum(row.winning_amount) }}</template>
      </el-table-column>
      <el-table-column prop="winning_contract" label="中标合同" min-width="130" show-overflow-tooltip />
    </template>

    <template #form="{ form }">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="询价单号"><el-input v-model="form.inquiry_no" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="询价类型"><el-input v-model="form.inquiry_type" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="采购员"><el-input v-model="form.purchaser" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发布日期"><el-date-picker v-model="form.publish_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="截止日期"><el-date-picker v-model="form.deadline" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="报价日期"><el-date-picker v-model="form.quote_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="报价总额"><el-input-number v-model="form.total_quote" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="报价状态">
            <el-select v-model="form.quote_status" style="width: 100%">
              <el-option label="待报价" value="待报价" />
              <el-option label="已报价" value="已报价" />
              <el-option label="已中标" value="已中标" />
              <el-option label="未中标" value="未中标" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="中标金额"><el-input-number v-model="form.winning_amount" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="中标合同"><el-input v-model="form.winning_contract" /></el-form-item>
        </el-col>
      </el-row>
    </template>
  </DataTable>
</template>

<script setup>
import DataTable from '../components/DataTable.vue'

const defaultForm = {
  inquiry_no: '', inquiry_type: '', purchaser: '', publish_date: '', deadline: '',
  quote_date: '', total_quote: 0, quote_status: '', winning_amount: 0, winning_contract: ''
}

function formatNum(val) {
  if (!val && val !== 0) return ''
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>
