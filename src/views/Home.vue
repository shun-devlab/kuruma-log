<template>
  <div class="home">
    <header class="header">
      <div class="header-content">
        <h1>🚗 クルマログ</h1>
        <button @click="openSettings" class="btn-settings">⚙️</button>
      </div>
      <div class="header-date">{{ today }}</div>
    </header>

    <div v-if="upcomingMaintenance.length > 0" class="upcoming-banner">
      <h2>【次回予定】⚠️</h2>
      <div v-for="item in upcomingMaintenance.slice(0, 2)" :key="item.type" class="upcoming-item">
        <span class="icon">{{ getIcon(item.type) }}</span>
        <span class="label">{{ getLabel(item.type) }}</span>
        <span class="remaining" v-if="item.remaining_km !== undefined">
          あと {{ item.remaining_km.toLocaleString('ja-JP') }}km
        </span>
        <span class="date">{{ item.estimated_date || '予定なし' }}</span>
      </div>
    </div>

    <div class="timeline">
      <div class="timeline-header-row">
        <h2>【タイムライン】</h2>
        <select v-model="selectedTimelineDate" class="timeline-date-select">
          <option value="all">すべての日付</option>
          <option v-for="date in timelineDateOptions" :key="date" :value="date">
            {{ formatDate(date) }}
          </option>
        </select>
      </div>
      <div v-if="filteredTimelineRecords.length === 0" class="empty-state">
        条件に合う記録がありません。
      </div>
      <div v-for="record in filteredTimelineRecords" :key="record.id" class="timeline-item" @click="editRecord(record.id)">
        <div class="item-date">{{ formatDate(record.date) }}</div>
        <div class="item-content">
          <span class="icon">{{ getIcon(record.type) }}</span>
          <div class="item-main">
            <span class="label">{{ getLabel(record.type) }}</span>
            <div v-if="record.mileage" class="info">走行距離: {{ Number(record.mileage).toLocaleString('ja-JP') }}km</div>
            <div v-if="record.amount" class="info">金額: {{ formatCurrency(record.amount) }}</div>
            <div v-if="record.memo" class="info memo">{{ record.memo }}</div>
          </div>
          <div class="item-chevron">›</div>
        </div>
      </div>
    </div>

    <div class="monthly-expense">
      <h2>【月別支出】</h2>
      <div class="expense-summary">
        <span>{{ currentMonth }}: {{ formatCurrency(monthlyExpense) }}</span>
      </div>
      <div class="quick-links">
        <button @click="openStats" class="btn-link">📊 詳細を見る</button>
        <button @click="openHistory" class="btn-link">📚 記録一覧を見る</button>
      </div>
    </div>

    <div class="record-panel-section">
      <div class="record-strip-label">記録カテゴリ</div>
      <div class="record-buttons-scroll">
        <button
          v-for="recordType in recordTypes"
          :key="recordType.value"
          @click="selectRecord(recordType.value)"
          class="btn-record"
        >
          <span class="btn-record-icon">{{ recordType.icon }}</span>
          <span class="btn-record-label">{{ recordType.label }}</span>
        </button>
      </div>
    </div>

    <RecordPanel
      v-if="showRecordPanel"
      :record-type="selectedRecordType"
      :settings="settings"
      :suggested-mileage="suggestedMileage"
      :initial-record="selectedRecord"
      @save="saveRecord"
      @delete="deleteCurrentRecord"
      @close="closeRecordPanel"
    />
  </div>
</template>

<script>
import { maintenanceStore, settingsStore, initDatabase } from '../stores/db'
import { calculateNextMaintenance, suggestMileage } from '../utils/nextMaintenance'
import { RECORD_TYPES, getRecordMeta } from '../utils/recordMeta'
import RecordPanel from '../components/RecordPanel.vue'

export default {
  components: {
    RecordPanel
  },
  props: {
    initialEditRecord: {
      type: Object,
      default: null
    }
  },
  emits: ['open-stats', 'open-history', 'open-settings', 'consume-initial-edit'],
  data() {
    return {
      records: [],
      settings: {},
      showRecordPanel: false,
      selectedRecordType: null,
      selectedRecord: null,
      upcomingMaintenance: [],
      currentMileage: 0,
      selectedTimelineDate: 'all'
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
      const currentMonthRecords = this.records.filter((record) => {
        const recordDate = new Date(`${record.date}T00:00:00`)
        return recordDate.getFullYear() === now.getFullYear() && recordDate.getMonth() === now.getMonth()
      })
      return currentMonthRecords.reduce((sum, record) => sum + (Number(record.amount) || 0), 0)
    },
    suggestedMileage() {
      return suggestMileage(this.records, this.currentMileage)
    },
    recordTypes() {
      return RECORD_TYPES
    },
    timelineDateOptions() {
      return [...new Set(this.records.map((record) => record.date))].sort().reverse()
    },
    filteredTimelineRecords() {
      if (this.selectedTimelineDate === 'all') return this.records
      return this.records.filter((record) => record.date === this.selectedTimelineDate)
    }
  },
  watch: {
    initialEditRecord: {
      immediate: true,
      handler(record) {
        if (!record) return
        this.selectedRecord = record
        this.selectedRecordType = record.type
        this.showRecordPanel = true
        this.$emit('consume-initial-edit')
      }
    }
  },
  methods: {
    async loadRecords() {
      this.records = await maintenanceStore.getAll()
      this.updateUpcomingMaintenance()
    },
    async loadSettings() {
      this.settings = await settingsStore.get()
      this.currentMileage = Number(this.settings.current_mileage) || 0
    },
    async addRecord(recordData) {
      await maintenanceStore.add(recordData)
      this.settings.current_mileage = recordData.mileage || this.currentMileage
      await settingsStore.save(this.settings)
      this.currentMileage = Number(this.settings.current_mileage) || this.currentMileage
      await this.loadRecords()
      this.closeRecordPanel()
    },
    async saveRecord(recordData) {
      if (this.selectedRecord && this.selectedRecord.id) {
        await maintenanceStore.update(this.selectedRecord.id, recordData)
      } else {
        await maintenanceStore.add(recordData)
      }

      if (recordData.mileage) {
        this.settings.current_mileage = recordData.mileage
        await settingsStore.save(this.settings)
        this.currentMileage = Number(this.settings.current_mileage) || this.currentMileage
      }

      await this.loadRecords()
      this.closeRecordPanel()
    },
    async editRecord(id) {
      const record = await maintenanceStore.getById(id)
      if (!record) return
      this.selectedRecord = record
      this.selectedRecordType = record.type
      this.showRecordPanel = true
    },
    async deleteRecord(id) {
      const record = await maintenanceStore.getById(id)
      if (!record) return

      const confirmed = window.confirm(`${this.getLabel(record.type)}の記録を削除します。よろしいですか？`)
      if (!confirmed) return

      await maintenanceStore.delete(id)
      await this.loadRecords()
    },
    async deleteCurrentRecord() {
      if (!this.selectedRecord?.id) return
      await this.deleteRecord(this.selectedRecord.id)
      this.closeRecordPanel()
    },
    selectRecord(type) {
      this.selectedRecord = null
      this.selectedRecordType = type
      this.showRecordPanel = true
    },
    closeRecordPanel() {
      this.showRecordPanel = false
      this.selectedRecord = null
      this.selectedRecordType = null
    },
    openSettings() {
      this.$emit('open-settings')
    },
    openStats() {
      this.$emit('open-stats')
    },
    openHistory() {
      this.$emit('open-history')
    },
    updateUpcomingMaintenance() {
      this.upcomingMaintenance = calculateNextMaintenance(this.records, this.currentMileage, this.settings)
    },
    getIcon(type) {
      return getRecordMeta(type).icon
    },
    getLabel(type) {
      return getRecordMeta(type).fullLabel
    },
    formatDate(dateString) {
      const date = new Date(`${dateString}T00:00:00`)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },
    formatCurrency(value) {
      return `¥${Math.round(Number(value) || 0).toLocaleString('ja-JP')}`
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
  background: #ffffff;
}

.header {
  background: #ffffff;
  padding: 16px;
  border-bottom: 1px solid #dddddd;
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

.upcoming-banner {
  background: #ffe5b4;
  border: 1px solid #ffcc99;
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
  color: #ff9500;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.upcoming-item .date {
  color: #666666;
  font-size: 12px;
}

.timeline {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.timeline-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.timeline h2 {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
}

.timeline-date-select {
  border: 1px solid #dddddd;
  border-radius: 10px;
  padding: 8px 10px;
  background: #ffffff;
  color: #333333;
  font-size: 13px;
  max-width: 180px;
}

.timeline-date-select:focus {
  outline: none;
  border-color: #ff9500;
}

.empty-state {
  text-align: center;
  color: #999999;
  padding: 32px 16px;
}

.timeline-item {
  margin-bottom: 16px;
  border-bottom: 1px solid #eeeeee;
  padding: 10px 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
  margin-left: -8px;
  margin-right: -8px;
}

.timeline-item:hover {
  background: #fafafa;
}

.timeline-item:active {
  background: #f5f5f5;
}

.timeline-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
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

.item-main {
  flex: 1;
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

.memo {
  white-space: pre-wrap;
}

.item-chevron {
  font-size: 24px;
  color: #c3c3c3;
  line-height: 1;
  padding-top: 2px;
}

.monthly-expense {
  background: #f5f5f5;
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

.quick-links {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-link {
  background: none;
  border: none;
  color: #4a90e2;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 600;
}

.btn-link:hover {
  color: #ff9500;
}

.record-panel-section {
  position: sticky;
  bottom: 0;
  background: #f5f5f5;
  border-top: 1px solid #dddddd;
  padding: 12px 0 16px;
}

.record-strip-label {
  font-size: 13px;
  font-weight: 700;
  color: #666666;
  padding: 0 16px 10px;
}

.record-buttons-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 0 16px;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
}

.record-buttons-scroll::-webkit-scrollbar {
  height: 6px;
}

.record-buttons-scroll::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 999px;
}

.btn-record {
  flex: 0 0 88px;
  aspect-ratio: 1 / 1;
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 16px;
  padding: 10px 8px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  scroll-snap-align: start;
}

.btn-record-icon {
  font-size: 24px;
  line-height: 1;
}

.btn-record-label {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.25;
  text-align: center;
  word-break: keep-all;
}

.btn-record:hover {
  background: #fff8ef;
  border-color: #ff9500;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .header {
    padding: 12px;
  }

  .header-content h1 {
    font-size: 18px;
  }

  .timeline,
  .monthly-expense,
  .upcoming-banner {
    margin-left: 12px;
    margin-right: 12px;
    padding-left: 12px;
    padding-right: 12px;
  }

  .item-content {
    gap: 10px;
  }

  .item-actions {
    flex-direction: column;
    gap: 6px;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 10px 12px;
  }

  .header-date {
    font-size: 12px;
  }

  .timeline {
    padding: 12px;
  }

  .timeline-header-row {
    flex-direction: column;
    align-items: stretch;
  }

  .timeline-date-select {
    max-width: none;
    width: 100%;
  }

  .timeline-item {
    margin-bottom: 12px;
    padding-bottom: 10px;
  }

  .item-content {
    align-items: flex-start;
  }

  .item-main {
    min-width: 0;
  }

  .item-content .label {
    font-size: 13px;
  }

  .info {
    font-size: 11px;
  }

  .record-panel-section {
    padding-bottom: 12px;
  }

  .record-strip-label {
    padding: 0 12px 8px;
  }

  .record-buttons-scroll {
    padding: 0 12px;
    gap: 8px;
  }

  .btn-record {
    flex-basis: 78px;
    min-height: 78px;
    border-radius: 14px;
    padding: 8px 6px;
  }

  .btn-record-icon {
    font-size: 22px;
  }

  .btn-record-label {
    font-size: 10px;
  }
}
</style>
