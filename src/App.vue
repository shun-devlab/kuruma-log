<template>
  <div id="app" class="app">
    <Home
      v-if="currentPage === 'home'"
      :key="`home-${homeRefreshKey}`"
      :initial-edit-record="pendingEditRecord"
      @consume-initial-edit="pendingEditRecord = null"
      @open-settings="showSettings"
    />
    <StatisticsScreen
      v-else-if="currentPage === 'statistics'"
      :records="statsPayload.records"
      :settings="statsPayload.settings"
      @back="currentPage = 'home'"
    />
    <HistoryScreen
      v-else-if="currentPage === 'history'"
      :records="historyRecords"
      @back="currentPage = 'home'"
      @edit-record="openHistoryRecordEditor"
      @delete-record="deleteHistoryRecord"
    />
    <SettingsScreen
      v-else
      :settings="settingsPayload"
      @back="currentPage = 'home'"
      @saved="refreshHomeAfterSettings"
    />

    <nav v-if="currentPage !== 'settings'" class="bottom-tabs">
      <button class="tab-btn" :class="{ active: currentPage === 'home' }" @click="currentPage = 'home'">📝<span>記録</span></button>
      <button class="tab-btn" :class="{ active: currentPage === 'statistics' }" @click="showStatistics">📊<span>まとめ</span></button>
      <button class="tab-btn" :class="{ active: currentPage === 'history' }" @click="showHistory">📚<span>一覧</span></button>
    </nav>
  </div>
</template>

<script>
import Home from './views/Home.vue'
import StatisticsScreen from './views/StatisticsScreen.vue'
import HistoryScreen from './views/HistoryScreen.vue'
import SettingsScreen from './views/SettingsScreen.vue'
import { maintenanceStore, settingsStore } from './stores/db'

export default {
  components: {
    Home,
    StatisticsScreen,
    HistoryScreen,
    SettingsScreen
  },
  data() {
    return {
      currentPage: 'home',
      statsPayload: {
        records: [],
        settings: {}
      },
      historyRecords: [],
      pendingEditRecord: null,
      settingsPayload: {},
      homeRefreshKey: 0
    }
  },
  methods: {
    async showStatistics() {
      this.statsPayload = await maintenanceStore.getDashboardData()
      this.currentPage = 'statistics'
    },
    async showHistory() {
      this.historyRecords = await maintenanceStore.getAll()
      this.currentPage = 'history'
    },
    async showSettings() {
      this.settingsPayload = await settingsStore.get()
      this.currentPage = 'settings'
    },
    openHistoryRecordEditor(record) {
      this.pendingEditRecord = record
      this.currentPage = 'home'
    },
    async deleteHistoryRecord(record) {
      if (!record?.id) return
      await maintenanceStore.delete(record.id)
      this.historyRecords = await maintenanceStore.getAll()
    },
    async refreshHomeAfterSettings() {
      this.settingsPayload = await settingsStore.get()
      this.homeRefreshKey += 1
      this.currentPage = 'home'
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #ffffff;
  color: #333333;
}

button,
input,
textarea {
  font: inherit;
}

#app {
  min-height: 100vh;
}

.app {
  max-width: 960px;
  margin: 0 auto;
  background: #ffffff;
  min-height: 100vh;
  padding-bottom: 88px;
}

.bottom-tabs {
  position: sticky;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid #e5e5e5;
  backdrop-filter: blur(8px);
}

.tab-btn {
  border: none;
  background: none;
  padding: 10px 8px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #777777;
  cursor: pointer;
  font-weight: 600;
}

.tab-btn span {
  font-size: 12px;
}

.tab-btn.active {
  color: #ff9500;
}
</style>
