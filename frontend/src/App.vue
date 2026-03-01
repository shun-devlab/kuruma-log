<template>
  <HomeScreen />
</template>

<script>
import { onMounted } from 'vue'
import HomeScreen from './components/HomeScreen.vue'
import { initializeDB, addMaintenanceRecord, getAllMaintenanceRecords } from './db'

export default {
  name: 'App',
  components: {
    HomeScreen
  },
  setup() {
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

    return {}
  }
}
</script>

<style>
#app {
  width: 100%;
  margin: 0;
  padding: 0;
}

body {
  margin: 0;
  padding: 0;
}

html {
  margin: 0;
  padding: 0;
}
</style>
