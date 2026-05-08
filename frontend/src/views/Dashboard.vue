<template>
  <div class="dashboard">
    <!-- Stats Cards -->
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="12" :sm="8" :md="4" v-for="card in statsCards" :key="card.label">
        <el-card shadow="hover" class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-icon" :style="{ background: card.color }">
            <el-icon :size="28"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ card.value }}</div>
            <div class="stat-label">{{ card.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Row -->
    <el-row :gutter="16" style="margin-top: 16px">
      <!-- Status Distribution -->
      <el-col :xs="24" :md="8">
        <el-card shadow="hover">
          <template #header><span>合同状态分布</span></template>
          <div class="chart-container">
            <div v-for="item in data.statusStats" :key="item.status" class="bar-item">
              <span class="bar-label">{{ item.status || '未知' }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: barWidth(item.cnt, maxStatus), background: statusColor(item.status) }"></div>
              </div>
              <span class="bar-value">{{ item.cnt }}</span>
            </div>
            <div v-if="!data.statusStats?.length" class="empty-chart">暂无数据</div>
          </div>
        </el-card>
      </el-col>

      <!-- Payment Status -->
      <el-col :xs="24" :md="8">
        <el-card shadow="hover">
          <template #header><span>付款状态分布</span></template>
          <div class="chart-container">
            <div v-for="item in data.paymentStats" :key="item.payment_status" class="bar-item">
              <span class="bar-label">{{ item.payment_status || '未知' }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: barWidth(item.cnt, maxPayment), background: paymentColor(item.payment_status) }"></div>
              </div>
              <span class="bar-value">{{ item.cnt }}</span>
            </div>
            <div v-if="!data.paymentStats?.length" class="empty-chart">暂无数据</div>
          </div>
        </el-card>
      </el-col>

      <!-- By Purchaser -->
      <el-col :xs="24" :md="8">
        <el-card shadow="hover">
          <template #header><span>采购员合同统计</span></template>
          <div class="chart-container">
            <div v-for="item in data.purchaserStats" :key="item.purchaser" class="bar-item">
              <span class="bar-label">{{ item.purchaser }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: barWidth(item.total_amount, maxPurchaser), background: '#409EFF' }"></div>
              </div>
              <span class="bar-value">{{ formatMoney(item.total_amount) }}</span>
            </div>
            <div v-if="!data.purchaserStats?.length" class="empty-chart">暂无数据</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Second Row -->
    <el-row :gutter="16" style="margin-top: 16px">
      <!-- Monthly Trend -->
      <el-col :xs="24" :md="12">
        <el-card shadow="hover">
          <template #header><span>月度趋势</span></template>
          <div class="trend-chart">
            <div v-for="item in data.monthlyTrend" :key="item.month" class="trend-item">
              <div class="trend-month">{{ item.month }}</div>
              <div class="trend-bar-track">
                <div class="trend-bar-fill" :style="{ height: trendHeight(item.amount) }"></div>
              </div>
              <div class="trend-value">{{ formatMoney(item.amount) }}</div>
            </div>
            <div v-if="!data.monthlyTrend?.length" class="empty-chart">暂无数据</div>
          </div>
        </el-card>
      </el-col>

      <!-- Procurement & Shipping -->
      <el-col :xs="24" :md="12">
        <el-card shadow="hover">
          <template #header><span>采购发货状态</span></template>
          <el-row :gutter="20">
            <el-col :span="12">
              <h4 style="margin-bottom: 12px; color: #606266">采购状态</h4>
              <div v-for="item in data.procurementStats" :key="item.status" class="bar-item">
                <span class="bar-label">{{ item.status || '未知' }}</span>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: barWidth(item.cnt, maxProcurement), background: statusColor(item.status) }"></div>
                </div>
                <span class="bar-value">{{ item.cnt }}</span>
              </div>
              <div v-if="!data.procurementStats?.length" class="empty-chart">暂无数据</div>
            </el-col>
            <el-col :span="12">
              <h4 style="margin-bottom: 12px; color: #606266">发货状态</h4>
              <div v-for="item in data.shippingStats" :key="item.shipping_status" class="bar-item">
                <span class="bar-label">{{ item.shipping_status || '未知' }}</span>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: barWidth(item.cnt, maxShipping), background: shippingColor(item.shipping_status) }"></div>
                </div>
                <span class="bar-value">{{ item.cnt }}</span>
              </div>
              <div v-if="!data.shippingStats?.length" class="empty-chart">暂无数据</div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api'

const data = ref({})

const statsCards = computed(() => [
  { label: '合同总数', value: data.value.totalContracts ?? '-', icon: 'Document', color: '#409EFF' },
  { label: '已开票合同', value: data.value.invoicedContracts ?? '-', icon: 'Stamp', color: '#67C23A' },
  { label: '销售总额', value: formatMoney(data.value.totalAmount), icon: 'Money', color: '#E6A23C' },
  { label: '未开票金额', value: formatMoney(data.value.uninvoicedAmount), icon: 'Warning', color: '#F56C6C' },
  { label: '未订货合同', value: data.value.unorderedCount ?? '-', icon: 'ShoppingCart', color: '#909399' }
])

const maxStatus = computed(() => Math.max(1, ...(data.value.statusStats || []).map(i => i.cnt)))
const maxPayment = computed(() => Math.max(1, ...(data.value.paymentStats || []).map(i => i.cnt)))
const maxPurchaser = computed(() => Math.max(1, ...(data.value.purchaserStats || []).map(i => i.total_amount)))
const maxProcurement = computed(() => Math.max(1, ...(data.value.procurementStats || []).map(i => i.cnt)))
const maxShipping = computed(() => Math.max(1, ...(data.value.shippingStats || []).map(i => i.cnt)))

function barWidth(val, max) {
  return Math.max(4, (val / max) * 100) + '%'
}

function trendHeight(amount) {
  const max = Math.max(1, ...(data.value.monthlyTrend || []).map(i => i.amount))
  return Math.max(4, (amount / max) * 100) + '%'
}

function formatMoney(val) {
  if (val === undefined || val === null) return '-'
  if (val >= 10000) return (val / 10000).toFixed(2) + '万'
  return val.toFixed(2)
}

function statusColor(s) {
  if (s === '已完成' || s === '已送货') return '#67C23A'
  if (s === '已取消') return '#F56C6C'
  return '#409EFF'
}

function paymentColor(s) {
  if (s === '已收款') return '#67C23A'
  if (s === '已挂账') return '#E6A23C'
  return '#909399'
}

function shippingColor(s) {
  if (s === '已发货') return '#67C23A'
  if (s === '部分发货') return '#E6A23C'
  return '#909399'
}

onMounted(async () => {
  try {
    const res = await api.get('/api/dashboard')
    data.value = res.data
  } catch {}
})
</script>

<style scoped>
.stats-row .el-col {
  margin-bottom: 12px;
}
.stat-card {
  display: flex;
  align-items: center;
}
.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
.chart-container {
  min-height: 120px;
}
.bar-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 8px;
}
.bar-label {
  width: 60px;
  font-size: 13px;
  color: #606266;
  text-align: right;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bar-track {
  flex: 1;
  height: 20px;
  background: #f0f2f5;
  border-radius: 4px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
  min-width: 4px;
}
.bar-value {
  width: 60px;
  font-size: 13px;
  color: #303133;
  font-weight: 600;
  text-align: right;
  flex-shrink: 0;
}
.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 180px;
  padding-top: 10px;
}
.trend-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}
.trend-month {
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
  transform: rotate(-45deg);
  white-space: nowrap;
}
.trend-bar-track {
  width: 100%;
  max-width: 40px;
  height: 100px;
  background: #f0f2f5;
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}
.trend-bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #409EFF, #79bbff);
  border-radius: 4px 4px 0 0;
  transition: height 0.6s ease;
  min-height: 4px;
}
.trend-value {
  font-size: 10px;
  color: #606266;
  margin-top: 4px;
  white-space: nowrap;
}
.empty-chart {
  text-align: center;
  color: #c0c4cc;
  padding: 40px 0;
}
</style>
