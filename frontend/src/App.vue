<template>
  <div class="app-container">
    <!-- タブナビゲーション -->
    <nav class="tab-navigation">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: currentTab === tab.id }"
        @click="currentTab = tab.id"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </nav>

    <!-- タブコンテンツ -->
    <div class="tab-content">
      <HomeScreen v-if="currentTab === 'home'" @open-list="currentTab = 'list'" />
      <RecordListScreen v-if="currentTab === 'list'" />
      <StatisticsScreen v-if="currentTab === 'stats'" />
      <SettingsScreen v-if="currentTab === 'settings'" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import HomeScreen from './components/HomeScreen.vue'
import RecordListScreen from './components/RecordListScreen.vue'
import StatisticsScreen from './components/StatisticsScreen.vue'
import SettingsScreen from './components/SettingsScreen.vue'
import { initializeDB, addMaintenanceRecord, getAllMaintenanceRecords } from './db'

export default {
  name: 'App',
  components: {
    HomeScreen,
    RecordListScreen,
    StatisticsScreen,
    SettingsScreen
  },
  setup() {
    const currentTab = ref('home')
    const tabs = [
      { id: 'home', label: 'ホーム', icon: '🏠' },
      { id: 'list', label: '一覧', icon: '📋' },
      { id: 'stats', label: '統計', icon: '📊' },
      { id: 'settings', label: '設定', icon: '⚙️' }
    ]

    onMounted(async () => {
      // DB 初期化
      await initializeDB()

      // ダミーデータ追加（初回のみ）
      try {
        const records = await getAllMaintenanceRecords()
        if (records.length === 0) {
          console.log('[App] ダミーデータを追加しています...')
          
          await addMaintenanceRecord({
            type: 'gasoline',
            date: new Date(2026, 2, 1), // 2026-03-01
            mileage: 45200,
            amount: 3500,
            memo: '高速道路走行'
          })

          await addMaintenanceRecord({
            type: 'wash',
            date: new Date(2026, 1, 28), // 2026-02-28
            memo: '外装・内装クリーニング'
          })

          await addMaintenanceRecord({
            type: 'oil',
            date: new Date(2026, 0, 15), // 2026-01-15
            mileage: 40200,
            amount: 5000,
            memo: '専門店での交換'
          })

          await addMaintenanceRecord({
            type: 'repair',
            date: new Date(2026, 1, 20), // 2026-02-20
            mileage: 44000,
            amount: 15000,
            memo: 'バッテリー交換'
          })

          await addMaintenanceRecord({
            type: 'gasoline',
            date: new Date(2026, 1, 25), // 2026-02-25
            mileage: 44800,
            amount: 3200,
            memo: '通勤ガソリン'
          })

          console.log('[App] ダミーデータ追加完了')
        }
      } catch (error) {
        console.error('[App] 初期化エラー:', error)
      }
    })

    return {
      currentTab,
      tabs
    }
  }
}
</script>

<style>
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

#app {
  width: 100%;
  margin: 0;
  padding: 0;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f7fa;
}

/* ==================== タブナビゲーション ==================== */
.tab-navigation {
  display: flex;
  gap: 0;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  bottom: 0;
  z-index: 100;
}

.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 12px;
  color: #95a5a6;
  font-weight: 500;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
}

.tab-btn:hover {
  background: #f8f9fa;
  color: #667eea;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.tab-icon {
  font-size: 20px;
}

.tab-label {
  font-size: 11px;
}

/* ==================== タブコンテンツ ==================== */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 60px;
}

/* ==================== レスポンシブ ==================== */
@media (max-width: 600px) {
  .tab-navigation {
    position: fixed;
    bottom: 0;
    width: 100%;
  }

  .tab-content {
    padding-bottom: 70px;
  }
}
</style>
