<template>
  <div id="app" class="app">
    <Home
      v-if="currentPage === 'home'"
      :key="`home-${homeRefreshKey}`"
      :initial-edit-record="pendingEditRecord"
      @consume-initial-edit="pendingEditRecord = null"
      @open-stats="showStatistics"
      @open-history="showHistory"
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
}
</style>
