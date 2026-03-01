<template>
  <div class="home">
    <!-- ヘッダー -->
    <header class="header">
      <div class="header-content">
        <h1>🚗 クルマログ</h1>
        <button @click="openSettings" class="btn-settings">⚙️</button>
      </div>
      <div class="header-date">{{ today }}</div>
    </header>

    <!-- 次回予定バナー -->
    <div v-if="upcomingMaintenance.length > 0" class="upcoming-banner">
      <h2>【次回予定】⚠️</h2>
      <div v-for="item in upcomingMaintenance.slice(0, 2)" :key="item.type" class="upcoming-item">
        <span class="icon">{{ getIcon(item.type) }}</span>
        <span class="label">{{ getLabel(item.type) }}</span>
        <span class="remaining" v-if="item.remaining_km !== undefined">
          あと {{ item.remaining_km }}km
        </span>
        <span class="date">{{ item.estimated_date }}</span>
      </div>
    </div>

    <!-- タイムライン -->
    <div class="timeline">
      <h2>【タイムライン】</h2>
      <div v-if="records.length === 0" class="empty-state">
        記録がありません。最初の記録を作成しましょう！
      </div>
      <div v-for="record in records" :key="record.id" class="timeline-item">
        <div class="item-date">{{ formatDate(record.date) }}</div>
        <div class="item-content">
          <span class="icon">{{ getIcon(record.type) }}</span>
          <span class="label">{{ getLabel(record.type) }}</span>
          <div v-if="record.mileage" class="info">走行距離: {{ record.mileage }}km</div>
          <div v-if="record.amount" class="info">金額: ¥{{ record.amount }}</div>
          <button @click="editRecord(record.id)" class="btn-edit">編集</button>
        </div>
      </div>
    </div>

    <!-- 月別支出 -->
    <div class="monthly-expense">
      <h2>【月別支出】</h2>
      <div class="expense-summary">
        <span>{{ currentMonth }}: ¥{{ monthlyExpense }}</span>
      </div>
      <button @click="openStats" class="btn-link">📊 詳細を見る</button>
    </div>

    <!-- 記録ボタンエリア -->
    <div class="record-buttons">
      <button @click="selectRecord('gasoline')" class="btn-record">⛽<br>ガソリン</button>
      <button @click="selectRecord('oil')" class="btn-record">🛢️<br>オイル</button>
      <button @click="selectRecord('tire')" class="btn-record">🛞<br>タイヤ</button>
      <button @click="selectRecord('wash')" class="btn-record">🚿<br>洗車</button>
      <button @click="selectRecord('repair')" class="btn-record">⚠️<br>修理</button>
    </div>

    <!-- 記録パネル（モーダル） -->
    <RecordPanel 
      v-if="showRecordPanel"
      :record-type="selectedRecordType"
      :settings="settings"
      :suggested-mileage="suggestedMileage"
      @save="addRecord"
      @close="showRecordPanel = false"
    />
  </div>
</template>

<script>
import { maintenanceStore, settingsStore, initDatabase } from '../stores/db'
import { calculateNextMaintenance, suggestMileage } from '../utils/nextMaintenance'
import RecordPanel from '../components/RecordPanel.vue'

export default {
  components: {
    RecordPanel
  },
  data() {
    return {
      records: [],
      settings: {},
      showRecordPanel: false,
      selectedRecordType: null,
      upcomingMaintenance: [],
      currentMileage: 0
    }
  },
  computed: {
    today() {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dayName = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
      return `${year}-${month}-${day}（${dayName}）`
    },
    currentMonth() {
      const date = new Date()
      return `${date.getFullYear()}年${date.getMonth() + 1}月`
    },
    monthlyExpense() {
      const now = new Date()
      const currentMonthRecords = this.records.filter(r => {
        const recordDate = new Date(r.date)
        return recordDate.getFullYear() === now.getFullYear() && 
               recordDate.getMonth() === now.getMonth()
      })
      return currentMonthRecords.reduce((sum, r) => sum + (r.amount || 0), 0)
    },
    suggestedMileage() {
      return suggestMileage(this.records, this.currentMileage)
    }
  },
  methods: {
    async loadRecords() {
      this.records = await maintenanceStore.getAll()
      this.updateUpcomingMaintenance()
    },
    async loadSettings() {
      this.settings = await settingsStore.get()
      this.currentMileage = this.settings.current_mileage || 0
    },
    async addRecord(recordData) {
      await maintenanceStore.add(recordData)
      this.settings.current_mileage = recordData.mileage || this.currentMileage
      await settingsStore.save(this.settings)
      this.loadRecords()
      this.showRecordPanel = false
    },
    editRecord(id) {
      console.log('Edit record:', id)
      // 後で実装
    },
    selectRecord(type) {
      this.selectedRecordType = type
      this.showRecordPanel = true
    },
    openSettings() {
      console.log('Open settings')
      // 後で実装
    },
    openStats() {
      console.log('Open stats')
      // 後で実装
    },
    updateUpcomingMaintenance() {
      this.upcomingMaintenance = calculateNextMaintenance(
        this.records,
        this.currentMileage,
        this.settings
      )
    },
    getIcon(type) {
      const icons = {
        gasoline: '⛽',
        oil: '🛢️',
        tire: '🛞',
        wash: '🚿',
        repair: '⚠️'
      }
      return icons[type] || '📝'
    },
    getLabel(type) {
      const labels = {
        gasoline: 'ガソリン給油',
        oil: 'オイル交換',
        tire: 'タイヤ交換',
        wash: '洗車',
        repair: '故障・修理'
      }
      return labels[type] || 'その他'
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }
  },
  async mounted() {
    await initDatabase()
    await this.loadSettings()
    await this.loadRecords()
  }
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #FFFFFF;
}

/* ヘッダー */
.header {
  background: #FFFFFF;
  padding: 16px;
  border-bottom: 1px solid #DDDDDD;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.header-content h1 {
  font-size: 20px;
  font-weight: bold;
  color: #333333;
}

.btn-settings {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
}

.header-date {
  font-size: 14px;
  color: #666666;
}

/* 次回予定バナー */
.upcoming-banner {
  background: #FFE5B4;
  border: 1px solid #FFCC99;
  border-radius: 8px;
  padding: 16px;
  margin: 16px;
}

.upcoming-banner h2 {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
}

.upcoming-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.upcoming-item .icon {
  font-size: 24px;
}

.upcoming-item .label {
  flex: 1;
}

.upcoming-item .remaining {
  color: #FF9500;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.upcoming-item .date {
  color: #666666;
  font-size: 12px;
}

/* タイムライン */
.timeline {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.timeline h2 {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333333;
}

.empty-state {
  text-align: center;
  color: #999999;
  padding: 32px 16px;
}

.timeline-item {
  margin-bottom: 16px;
  border-bottom: 1px solid #EEEEEE;
  padding-bottom: 12px;
}

.item-date {
  font-size: 14px;
  color: #666666;
  margin-bottom: 8px;
}

.item-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.item-content .icon {
  font-size: 24px;
  flex-shrink: 0;
}

.item-content .label {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
}

.info {
  font-size: 12px;
  color: #666666;
  margin-top: 4px;
}

.btn-edit {
  font-size: 12px;
  color: #4A90E2;
  background: none;
  border: none;
  cursor: pointer;
  margin-top: 4px;
}

/* 月別支出 */
.monthly-expense {
  background: #F5F5F5;
  padding: 16px;
  margin: 16px;
  border-radius: 8px;
}

.monthly-expense h2 {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.expense-summary {
  font-size: 14px;
  color: #333333;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.btn-link {
  background: none;
  border: none;
  color: #4A90E2;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
}

/* 記録ボタン */
.record-buttons {
  display: flex;
  justify-content: space-around;
  background: #F5F5F5;
  padding: 16px;
  gap: 8px;
  position: sticky;
  bottom: 0;
  border-top: 1px solid #DDDDDD;
}

.btn-record {
  flex: 1;
  background: #FFFFFF;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  padding: 12px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.btn-record:hover {
  background: #F5F5F5;
  border-color: #FF9500;
}

.btn-record > div:first-child {
  font-size: 32px;
}
</style>
