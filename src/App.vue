<template>
  <div id="app" class="app">
    <Home
      v-if="currentPage === 'home'"
      :initial-edit-record="pendingEditRecord"
      @consume-initial-edit="pendingEditRecord = null"
      @open-stats="showStatistics"
      @open-history="showHistory"
    />
    <StatisticsScreen
      v-else-if="currentPage === 'statistics'"
      :records="statsPayload.records"
      :settings="statsPayload.settings"
      @back="currentPage = 'home'"
    />
    <HistoryScreen
      v-else
      :records="historyRecords"
      @back="currentPage = 'home'"
      @edit-record="openHistoryRecordEditor"
    />
  </div>
</template>

<script>
import Home from './views/Home.vue'
import StatisticsScreen from './views/StatisticsScreen.vue'
import HistoryScreen from './views/HistoryScreen.vue'
import { maintenanceStore } from './stores/db'

export default {
  components: {
    Home,
    StatisticsScreen,
    HistoryScreen
  },
  data() {
    return {
      currentPage: 'home',
      statsPayload: {
        records: [],
        settings: {}
      },
      historyRecords: [],
      pendingEditRecord: null
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
    openHistoryRecordEditor(record) {
      this.pendingEditRecord = record
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
