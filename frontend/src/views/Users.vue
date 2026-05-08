<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div class="toolbar">
          <span>用户管理</span>
          <el-button type="primary" @click="openForm()" :icon="Plus">新增用户</el-button>
        </div>
      </template>

      <el-table :data="users" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="name" label="姓名" width="140" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : row.role === 'finance' ? 'warning' : row.role === 'purchaser' ? 'primary' : 'info'" size="small">
              {{ roleMap[row.role] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openForm(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Form Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" />
        </el-form-item>
        <el-form-item label="密码" :prop="isEdit ? '' : 'password'">
          <el-input v-model="formData.password" type="password" :placeholder="isEdit ? '留空则不修改' : '请输入密码'" show-password />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="采购员" value="purchaser" />
            <el-option label="财务" value="finance" />
            <el-option label="查看者" value="viewer" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const roleMap = { admin: '管理员', purchaser: '采购员', finance: '财务', viewer: '查看者' }

const users = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formData = ref({ username: '', password: '', name: '', role: 'purchaser' })
const formRef = ref()

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

async function loadUsers() {
  loading.value = true
  try {
    const res = await api.get('/api/users')
    users.value = res.data
  } catch {} finally {
    loading.value = false
  }
}

function openForm(row) {
  isEdit.value = !!row
  editId.value = row?.id || null
  formData.value = row ? { ...row, password: '' } : { username: '', password: '', name: '', role: 'purchaser' }
  dialogVisible.value = true
}

async function handleSave() {
  // For edit, password is optional
  if (!isEdit.value) {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return
  } else {
    // Only validate non-password fields for edit
    try {
      await formRef.value.validateField(['username', 'name', 'role'])
    } catch {
      return
    }
  }

  saving.value = true
  try {
    const payload = { ...formData.value }
    if (isEdit.value && !payload.password) delete payload.password

    if (isEdit.value) {
      await api.put(`/api/users/${editId.value}`, payload)
      ElMessage.success('更新成功')
    } else {
      await api.post('/api/users', payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadUsers()
  } catch {} finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${row.name}" 吗？`, '提示', { type: 'warning' })
    await api.delete(`/api/users/${row.id}`)
    ElMessage.success('删除成功')
    loadUsers()
  } catch {}
}

onMounted(loadUsers)
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
