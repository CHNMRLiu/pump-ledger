<template>
  <el-container class="layout-container">
    <!-- Mobile overlay -->
    <div v-if="isMobile && sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false" />

    <!-- Sidebar -->
    <el-aside :width="sidebarOpen ? '220px' : '0'" class="sidebar" :class="{ mobile: isMobile, open: sidebarOpen }">
      <div class="logo">
        <span v-if="sidebarOpen">🔧 水泵厂台账</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        :collapse="!sidebarOpen"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>看板</template>
        </el-menu-item>
        <el-menu-item index="/contracts">
          <el-icon><Document /></el-icon>
          <template #title>合同总表</template>
        </el-menu-item>
        <el-menu-item index="/contract-details">
          <el-icon><List /></el-icon>
          <template #title>合同明细表</template>
        </el-menu-item>
        <el-menu-item index="/procurement">
          <el-icon><ShoppingCart /></el-icon>
          <template #title>合同采购登记本</template>
        </el-menu-item>
        <el-menu-item index="/advance">
          <el-icon><Clock /></el-icon>
          <template #title>提前采购清单</template>
        </el-menu-item>
        <el-menu-item index="/quotations">
          <el-icon><PriceTag /></el-icon>
          <template #title>报价管理</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.user?.role === 'admin'" index="/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- Main -->
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="menu-toggle" @click="sidebarOpen = !sidebarOpen"><Expand /></el-icon>
          <span class="page-title">{{ currentTitle }}</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><UserFilled /></el-icon>
              {{ userStore.user?.name }} ({{ roleLabel }})
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const sidebarOpen = ref(true)
const isMobile = ref(false)

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta?.title || '')

const roleMap = { admin: '管理员', purchaser: '采购员', finance: '财务', viewer: '查看者' }
const roleLabel = computed(() => roleMap[userStore.user?.role] || '')

function handleCommand(cmd) {
  if (cmd === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}

function checkMobile() {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) sidebarOpen.value = false
}

onMounted(() => {
  userStore.fetchUser()
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}
.sidebar {
  background: #304156;
  overflow: hidden;
  transition: width 0.3s;
  position: relative;
  z-index: 100;
}
.sidebar.mobile {
  position: fixed;
  height: 100vh;
  top: 0;
  left: 0;
}
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 99;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
  background: #263445;
}
.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 0 20px;
  z-index: 10;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.menu-toggle {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
}
.main-content {
  background: #f0f2f5;
  padding: 20px;
}
</style>
