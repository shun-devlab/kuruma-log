<template>
  <div class="home-screen">
    <!-- ヘッダー -->
    <header class="header">
      <h1 class="title">🚗 クルマログ</h1>
    </header>

    <!-- メインコンテンツ -->
    <main class="main-content">
      <!-- 次回予定セクション -->
      <section class="upcoming-section">
        <h2 class="section-title">⚠️ 次回予定</h2>
        <div class="upcoming-cards">
          <div class="upcoming-card alert" v-if="upcomingMaintenance.oil">
            <div class="card-header">
              <span class="icon">🛢️</span>
              <span class="name">エンジンオイル交換</span>
            </div>
            <div class="card-body">
              <p class="distance">あと <strong>{{ upcomingMaintenance.oil.distance }}</strong> km</p>
              <p class="date">{{ upcomingMaintenance.oil.date }}</p>
            </div>
          </div>

          <div class="upcoming-card" v-if="upcomingMaintenance.tire">
            <div class="card-header">
              <span class="icon">🛞</span>
              <span class="name">タイヤ交換</span>
            </div>
            <div class="card-body">
              <p class="distance">あと <strong>{{ upcomingMaintenance.tire.distance }}</strong> km</p>
              <p class="date">{{ upcomingMaintenance.tire.date }}</p>
            </div>
          </div>

          <div class="upcoming-card" v-if="upcomingMaintenance.wash">
            <div class="card-header">
              <span class="icon">🚿</span>
              <span class="name">洗車</span>
            </div>
            <div class="card-body">
              <p class="note">前回から <strong>{{ upcomingMaintenance.wash.days }}</strong> 日経過</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 最近の記録セクション -->
      <section class="recent-section">
        <div class="section-header">
          <h2 class="section-title">📝 最近の記録</h2>
          <button class="view-all" @click="$emit('open-list')">一覧表示</button>
        </div>

        <div class="recent-list">
          <div class="record-item" v-for="record in recentRecords" :key="record.id">
            <div class="record-left">
              <span class="record-icon">{{ getIcon(record.type) }}</span>
              <div class="record-info">
                <p class="record-type">{{ getTypeName(record.type) }}</p>
                <p class="record-date">{{ formatDate(record.date) }}</p>
              </div>
            </div>
            <div class="record-right">
              <p class="record-amount" v-if="record.amount">{{ formatAmount(record.amount) }}</p>
              <p class="record-distance" v-if="record.mileage">{{ record.mileage }}km</p>
              <span class="record-actions" v-if="!record.amount && !record.mileage">-</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 統計セクション -->
      <section class="stats-section">
        <h2 class="section-title">📊 支出サマリー</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <p class="stat-label">今月の支出</p>
            <p class="stat-value">{{ monthlyExpense }}</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">総走行距離</p>
            <p class="stat-value">{{ totalMileage }}km</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">平均燃費</p>
            <p class="stat-value">{{ averageFuel }}km/L</p>
          </div>
        </div>
      </section>
    </main>

    <!-- フローティング操作パネル -->
    <footer class="footer">
      <button class="btn btn-primary" @click="openNewRecord">+ 新規記録</button>
      <button class="btn btn-secondary" @click="$emit('open-list')">📊 一覧</button>
    </footer>

    <!-- 新規記録フォーム（モーダル） -->
    <NewRecordForm 
      :isOpen="isNewRecordFormOpen"
      @close="closeNewRecordForm"
      @submit="onRecordSubmit"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { getAllMaintenanceRecords, getUserSettings } from '../db'
import NewRecordForm from './NewRecordForm.vue'

export default {
  name: 'HomeScreen',
  components: {
    NewRecordForm
  },
  emits: ['open-list'],
  setup() {
    const records = ref([])
    const settings = ref(null)
    const isNewRecordFormOpen = ref(false)

    // 最近の記録（最新 5 件）
    const recentRecords = computed(() => records.value.slice(0, 5))

    // 次回予定を計算
    const upcomingMaintenance = computed(() => {
      const upcoming = {}

      // オイル交換
      const lastOil = records.value.find(r => r.type === 'oil')
      if (lastOil) {
        const nextDistance = lastOil.mileage + (settings.value?.oil_change_interval_km || 5000)
        const currentMileage = settings.value?.current_mileage || 0
        upcoming.oil = {
          distance: Math.max(0, nextDistance - currentMileage),
          date: '2026-04-15'
        }
      }

      // タイヤ交換
      const lastTire = records.value.find(r => r.type === 'tire')
      if (lastTire) {
        const nextDistance = lastTire.mileage + 50000
        const currentMileage = settings.value?.current_mileage || 0
        upcoming.tire = {
          distance: Math.max(0, nextDistance - currentMileage),
          date: '2026-06-01'
        }
      }

      // 洗車
      const lastWash = records.value.find(r => r.type === 'wash')
      if (lastWash) {
        const now = new Date()
        const lastDate = new Date(lastWash.date)
        const days = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24))
        upcoming.wash = { days }
      }

      return upcoming
    })

    // 今月の支出
    const monthlyExpense = computed(() => {
      const now = new Date()
      const currentMonth = records.value.filter(r => {
        const recordDate = new Date(r.date)
        return recordDate.getMonth() === now.getMonth() &&
               recordDate.getFullYear() === now.getFullYear() &&
               r.type === 'gasoline'
      })
      const total = currentMonth.reduce((sum, r) => sum + (r.amount || 0), 0)
      return `¥${total.toLocaleString()}`
    })

    // 総走行距離
    const totalMileage = computed(() => {
      const maxMileage = Math.max(0, ...records.value.map(r => r.mileage || 0))
      return maxMileage.toLocaleString()
    })

    // 平均燃費
    const averageFuel = computed(() => {
      const gasRecords = records.value.filter(r => r.type === 'gasoline')
      if (gasRecords.length === 0) return '0'
      const totalLiters = gasRecords.reduce((sum, r) => sum + (r.mileage || 0), 0)
      const totalDistance = records.value
        .filter(r => r.mileage)
        .reduce((sum, r) => sum + r.mileage, 0)
      return totalDistance > 0 ? (totalDistance / totalLiters).toFixed(1) : '0'
    })

    // 日付フォーマット
    const formatDate = (date) => {
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    // 金額フォーマット
    const formatAmount = (amount) => `¥${amount.toLocaleString()}`

    // アイコン取得
    const getIcon = (type) => {
      const icons = {
        gasoline: '⛽',
        oil: '🛢️',
        tire: '🛞',
        wash: '🚿',
        repair: '⚠️'
      }
      return icons[type] || '📝'
    }

    // タイプ名取得
    const getTypeName = (type) => {
      const names = {
        gasoline: 'ガソリン給油',
        oil: 'オイル交換',
        tire: 'タイヤ交換',
        wash: '洗車',
        repair: '故障・修理'
      }
      return names[type] || type
    }

    // 新規記録を開く
    const openNewRecord = () => {
      isNewRecordFormOpen.value = true
    }

    // フォームを閉じる
    const closeNewRecordForm = () => {
      isNewRecordFormOpen.value = false
    }

    // 記録が提出されたときの処理
    const onRecordSubmit = async (record) => {
      console.log('[HomeScreen] 新規記録が保存されました:', record)
      // レコードをリロード
      records.value = await getAllMaintenanceRecords()
    }

    // マウント時：データ読み込み
    onMounted(async () => {
      records.value = await getAllMaintenanceRecords()
      settings.value = await getUserSettings()
    })

    return {
      records,
      settings,
      isNewRecordFormOpen,
      recentRecords,
      upcomingMaintenance,
      monthlyExpense,
      totalMileage,
      averageFuel,
      formatDate,
      formatAmount,
      getIcon,
      getTypeName,
      openNewRecord,
      closeNewRecordForm,
      onRecordSubmit
    }
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.home-screen {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* ==================== ヘッダー ==================== */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 1px;
}

/* ==================== メインコンテンツ ==================== */
.main-content {
  flex: 1;
  padding: 24px 16px;
  overflow-y: auto;
}

/* セクション基本スタイル */
.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.view-all {
  font-size: 13px;
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.view-all:hover {
  color: #764ba2;
}

/* ==================== 次回予定セクション ==================== */
.upcoming-section {
  margin-bottom: 32px;
}

.upcoming-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upcoming-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #667eea;
  transition: transform 0.2s, box-shadow 0.2s;
}

.upcoming-card.alert {
  border-left-color: #e74c3c;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
}

.upcoming-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.icon {
  font-size: 24px;
}

.name {
  font-weight: 600;
  color: #2c3e50;
}

.card-body {
  padding-left: 36px;
}

.distance {
  margin: 8px 0;
  font-size: 16px;
  color: #34495e;
}

.distance strong {
  font-size: 18px;
  color: #e74c3c;
}

.date {
  margin: 8px 0 0 0;
  font-size: 13px;
  color: #7f8c8d;
}

.note {
  margin: 0;
  font-size: 14px;
  color: #34495e;
}

/* ==================== 最近の記録セクション ==================== */
.recent-section {
  margin-bottom: 32px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-item {
  background: white;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  transition: background-color 0.2s;
}

.record-item:hover {
  background-color: #f8f9fa;
}

.record-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.record-icon {
  font-size: 24px;
}

.record-info {
  flex: 1;
}

.record-type {
  margin: 0;
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.record-date {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #95a5a6;
}

.record-right {
  text-align: right;
}

.record-amount {
  margin: 0;
  font-weight: 600;
  color: #e74c3c;
  font-size: 14px;
}

.record-distance {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #95a5a6;
}

.record-actions {
  color: #bdc3c7;
  font-size: 12px;
}

/* ==================== 統計セクション ==================== */
.stats-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.stat-label {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #7f8c8d;
  font-weight: 500;
}

.stat-value {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #667eea;
}

/* ==================== フッター（アクションボタン） ==================== */
.footer {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  bottom: 60px;
}

.btn {
  flex: 1;
  padding: 14px 16px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #ecf0f1;
  color: #2c3e50;
}

.btn-secondary:hover {
  background: #d5dbdb;
}

/* ==================== レスポンシブ ==================== */
@media (max-width: 600px) {
  .title {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .main-content {
    padding: 16px 12px;
  }
}
</style>
