<template>
  <div class="data-table-page">
    <!-- Toolbar -->
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input v-model="search" placeholder="搜索..." clearable prefix-icon="Search" style="width: 240px" @clear="loadData" @keyup.enter="loadData" />
          <el-button type="primary" @click="loadData" :icon="Search">搜索</el-button>
          <slot name="filters" />
        </div>
        <div class="toolbar-right">
          <slot name="actions" />
          <el-button v-if="canCreate" type="success" @click="openForm()" :icon="Plus">新增</el-button>
          <el-button @click="handleExport" :icon="Download">导出Excel</el-button>
        </div>
      </div>
    </el-card>

    <!-- Table -->
    <el-card shadow="never" style="margin-top: 12px">
      <el-table
        :data="tableData"
        stripe
        highlight-current-row
        border
        style="width: 100%"
        v-loading="loading"
        :max-height="tableHeight"
        @sort-change="handleSort"
      >
        <slot name="columns" />
        <el-table-column label="操作" width="160" fixed="right" v-if="canEdit || canDelete">
          <template #default="{ row }">
            <el-button v-if="canEditRow(row)" type="primary" link @click="openForm(row)">编辑</el-button>
            <el-button v-if="canDelete" type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- Form Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑' : '新增'" width="680px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px">
        <slot name="form" :form="formData" />
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/user'
import api from '../api'

const props = defineProps({
  table: { type: String, required: true },
  columns: { type: Array, default: () => [] },
  formFields: { type: Array, default: () => [] },
  defaultForm: { type: Object, default: () => ({}) },
  ownerField: { type: String, default: null }
})

const emit = defineEmits(['loaded'])

const userStore = useUserStore()
const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')
const sortField = ref('')
const sortOrder = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formData = ref({})
const formRef = ref()
const formRules = ref({})

const tableHeight = computed(() => window.innerHeight - 280)

const canCreate = computed(() => userStore.user?.role !== 'viewer')
const canEdit = computed(() => userStore.user?.role !== 'viewer')
const canDelete = computed(() => userStore.user?.role === 'admin')

function canEditRow(row) {
  if (!canEdit.value) return false
  if (userStore.user?.role === 'purchaser' && props.ownerField) {
    return row[props.ownerField] === userStore.user?.name
  }
  return true
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      search: search.value || undefined,
      sort: sortField.value || undefined,
      order: sortOrder.value || undefined
    }
    const res = await api.get(`/api/${props.table}`, { params })
    tableData.value = res.data.data
    total.value = res.data.total
    emit('loaded', res.data)
  } catch {} finally {
    loading.value = false
  }
}

function handleSort({ prop, order: dir }) {
  sortField.value = prop || ''
  sortOrder.value = dir === 'ascending' ? 'asc' : dir === 'descending' ? 'desc' : ''
  loadData()
}

function openForm(row) {
  isEdit.value = !!row
  editId.value = row?.id || null
  formData.value = row ? { ...row } : { ...props.defaultForm }
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (isEdit.value) {
      await api.put(`/api/${props.table}/${editId.value}`, formData.value)
      ElMessage.success('更新成功')
    } else {
      await api.post(`/api/${props.table}`, formData.value)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadData()
  } catch {} finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', { type: 'warning' })
    await api.delete(`/api/${props.table}/${row.id}`)
    ElMessage.success('删除成功')
    loadData()
  } catch {}
}

async function handleExport() {
  try {
    const res = await api.get(`/api/${props.table}/export`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.table}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch {}
}

onMounted(loadData)

defineExpose({ loadData })
</script>

<style scoped>
.toolbar-card :deep(.el-card__body) {
  padding: 16px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
