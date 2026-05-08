<template>
  <DataTable ref="tableRef" table="advance_procurement" :defaultForm="defaultForm" ownerField="applicant">
    <template #columns>
      <el-table-column prop="date" label="日期" width="110" sortable="custom" />
      <el-table-column prop="applicant" label="申请人" width="100" sortable="custom" />
      <el-table-column prop="name" label="名称" min-width="150" sortable="custom" show-overflow-tooltip />
      <el-table-column prop="amount" label="金额" width="120" sortable="custom" align="right">
        <template #default="{ row }">{{ formatNum(row.amount) }}</template>
      </el-table-column>
      <el-table-column prop="contract_no" label="合同编号" min-width="130" sortable="custom" show-overflow-tooltip />
      <el-table-column prop="contract_status" label="合同状态" width="100" sortable="custom">
        <template #default="{ row }">
          <el-tag v-if="row.contract_status" :type="row.contract_status === '已完成' ? 'success' : 'primary'" size="small">{{ row.contract_status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="system_contract" label="系统合同" min-width="120" show-overflow-tooltip />
      <el-table-column prop="project_no" label="项目编号" min-width="120" sortable="custom" show-overflow-tooltip />
      <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
    </template>

    <template #form="{ form }">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="日期"><el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="申请人"><el-input v-model="form.applicant" /></el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="金额"><el-input-number v-model="form.amount" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="合同编号"><el-input v-model="form.contract_no" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="合同状态"><el-input v-model="form.contract_status" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="系统合同"><el-input v-model="form.system_contract" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="项目编号"><el-input v-model="form.project_no" /></el-form-item>
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
  date: '', applicant: '', name: '', amount: 0, contract_no: '',
  contract_status: '', system_contract: '', project_no: '', remark: ''
}

function formatNum(val) {
  if (!val && val !== 0) return ''
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>
