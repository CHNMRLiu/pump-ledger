<template>
  <DataTable ref="tableRef" table="contract_details" :defaultForm="defaultForm">
    <template #columns>
      <el-table-column prop="contract_no" label="合同编号" min-width="130" sortable="custom" show-overflow-tooltip />
      <el-table-column prop="project_no" label="项目编号" min-width="120" sortable="custom" show-overflow-tooltip />
      <el-table-column prop="material_code" label="物料编码" min-width="120" sortable="custom" show-overflow-tooltip />
      <el-table-column prop="material_name" label="物料名称" min-width="150" sortable="custom" show-overflow-tooltip />
      <el-table-column prop="unit" label="单位" width="70" />
      <el-table-column prop="quantity" label="数量" width="90" sortable="custom" align="right" />
      <el-table-column prop="unit_price" label="单价" width="100" sortable="custom" align="right">
        <template #default="{ row }">{{ formatNum(row.unit_price) }}</template>
      </el-table-column>
      <el-table-column prop="total_with_tax" label="含税合计" width="120" sortable="custom" align="right">
        <template #default="{ row }">{{ formatNum(row.total_with_tax) }}</template>
      </el-table-column>
      <el-table-column prop="purchase_price" label="采购价" width="100" sortable="custom" align="right">
        <template #default="{ row }">{{ formatNum(row.purchase_price) }}</template>
      </el-table-column>
      <el-table-column prop="total_price" label="总价" width="120" sortable="custom" align="right">
        <template #default="{ row }">{{ formatNum(row.total_price) }}</template>
      </el-table-column>
      <el-table-column prop="purchase_contract_no" label="采购合同编号" min-width="130" show-overflow-tooltip />
      <el-table-column prop="supplier" label="供应商" min-width="120" show-overflow-tooltip />
      <el-table-column prop="sign_date" label="签订日期" width="110" sortable="custom" />
      <el-table-column prop="delivery_status" label="送货状态" width="100" />
      <el-table-column prop="delivery_date" label="送货日期" width="110" />
      <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
    </template>

    <template #form="{ form }">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="合同编号"><el-input v-model="form.contract_no" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="项目编号"><el-input v-model="form.project_no" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="物料编码"><el-input v-model="form.material_code" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="物料名称"><el-input v-model="form.material_name" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="单位"><el-input v-model="form.unit" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="数量"><el-input-number v-model="form.quantity" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="单价"><el-input-number v-model="form.unit_price" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="含税合计"><el-input-number v-model="form.total_with_tax" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="采购价"><el-input-number v-model="form.purchase_price" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="总价"><el-input-number v-model="form.total_price" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="采购合同编号"><el-input v-model="form.purchase_contract_no" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="供应商"><el-input v-model="form.supplier" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="签订日期"><el-date-picker v-model="form.sign_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="送货状态"><el-input v-model="form.delivery_status" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="送货日期"><el-date-picker v-model="form.delivery_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
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
  contract_no: '', project_no: '', material_code: '', material_name: '', unit: '',
  quantity: 0, unit_price: 0, total_with_tax: 0, purchase_price: 0, total_price: 0,
  purchase_contract_no: '', supplier: '', sign_date: '', delivery_status: '', delivery_date: '', remark: ''
}

function formatNum(val) {
  if (!val && val !== 0) return ''
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>
