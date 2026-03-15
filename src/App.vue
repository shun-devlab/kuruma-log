<template>
  <div id="app" class="app">
    <Home
      v-if="currentPage === 'home'"
      @open-stats="showStatistics"
    />
    <StatisticsScreen
      v-else
      :records="statsPayload.records"
      :settings="statsPayload.settings"
      @back="currentPage = 'home'"
    />
  </div>
</template>

<script>
import Home from './views/Home.vue'
import StatisticsScreen from './views/StatisticsScreen.vue'
import { maintenanceStore } from './stores/db'

export default {
  components: {
    Home,
    StatisticsScreen
  },
  data() {
    return {
      currentPage: 'home',
      statsPayload: {
        records: [],
        settings: {}
      }
    }
  },
  methods: {
    async showStatistics() {
      this.statsPayload = await maintenanceStore.getDashboardData()
      this.currentPage = 'statistics'
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
