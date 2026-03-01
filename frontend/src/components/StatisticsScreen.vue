<template>
  <div class="stats-screen">
    <!-- ヘッダー -->
    <header class="header">
      <h1 class="title">📊 統計ダッシュボード</h1>
    </header>

    <!-- メインコンテンツ -->
    <main class="main-content">
      <!-- Section 1: 月別支出グラフ -->
      <section v-if="monthlyChartData.labels.length > 0" class="chart-section">
        <MonthlyExpenseChart :chartData="monthlyChartData" />
      </section>

      <!-- Section 2: メンテナンス種類別円グラフ -->
      <section v-if="typeChartData.labels.length > 0" class="chart-section">
        <TypeBreakdownChart :chartData="typeChartData" />
      </section>

      <!-- Section 3: 走行距離・燃費推移 -->
      <section v-if="mileageChartData.labels.length > 0" class="chart-section">
        <MileageTrendChart :chartData="mileageChartData" />
      </section>

      <!-- Section 4: サマリー統計 -->
      <section class="summary-section">
        <h2 class="section-title">📋 統計サマリー</h2>
        
        <div class="stats-grid">
          <div class="stat-card">
            <p class="stat-label">総支出（全期間）</p>
            <p class="stat-value">¥{{ summary.totalExpense.toLocaleString() }}</p>
          </div>
          
          <div class="stat-card">
            <p class="stat-label">今月の支出</p>
            <p class="stat-value">¥{{ summary.monthlyExpense.toLocaleString() }}</p>
          </div>
          
          <div class="stat-card">
            <p class="stat-label">平均月額支出</p>
            <p class="stat-value">¥{{ summary.averageMonthlyExpense.toLocaleString() }}</p>
          </div>
          
          <div class="stat-card">
            <p class="stat-label">総走行距離</p>
            <p class="stat-value">{{ summary.totalMileage.toLocaleString() }} km</p>
          </div>
          
          <div class="stat-card">
            <p class="stat-label">平均燃費</p>
            <p class="stat-value">{{ summary.averageFuel }} km/L</p>
          </div>

          <div class="stat-card">
            <p class="stat-label">記録数</p>
            <p class="stat-value">{{ records.length }}</p>
          </div>
        </div>
      </section>

      <!-- Section 5: 最近のメンテナンス予定 -->
      <section v-if="Object.keys(upcomingMaintenance).length > 0" class="upcoming-section">
        <h2 class="section-title">⚠️ 次回予定</h2>
        
        <div class="upcoming-cards">
          <div v-if="upcomingMaintenance.oil" class="upcoming-card alert">
            <div class="card-header">
              <span class="icon">🛢️</span>
              <span class="name">エンジンオイル交換</span>
            </div>
            <div class="card-body">
              <p class="distance">あと <strong>{{ upcomingMaintenance.oil.distance }}</strong> km</p>
            </div>
          </div>

          <div v-if="upcomingMaintenance.tire" class="upcoming-card">
            <div class="card-header">
              <span class="icon">🛞</span>
              <span class="name">タイヤ交換</span>
            </div>
            <div class="card-body">
              <p class="distance">あと <strong>{{ upcomingMaintenance.tire.distance }}</strong> km</p>
            </div>
          </div>

          <div v-if="upcomingMaintenance.wash" class="upcoming-card">
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

      <!-- 空の状態 -->
      <div v-if="records.length === 0" class="empty-state">
        <p class="empty-icon">📊</p>
        <p class="empty-text">データがまだありません</p>
        <p class="empty-description">
          メンテナンス記録を追加すると、ここに統計情報が表示されます。
        </p>
      </div>
    </main>

    <!-- フッタースペース -->
    <footer class="footer-space"></footer>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { getAllMaintenanceRecords, getUserSettings } from '../db'
import { 
  calculateMonthlyExpenses, 
  calculateTypeBreakdown, 
  calculateMileageTrend,
  calculateSummary,
  getUpcomingMaintenance
} from '../utils/statistics'
import MonthlyExpenseChart from './MonthlyExpenseChart.vue'
import TypeBreakdownChart from './TypeBreakdownChart.vue'
import MileageTrendChart from './MileageTrendChart.vue'

export default {
  name: 'StatisticsScreen',
  components: {
    MonthlyExpenseChart,
    TypeBreakdownChart,
    MileageTrendChart
  },
  setup() {
    const records = ref([])
    const settings = ref(null)

    // グラフデータ
    const monthlyChartData = computed(() => 
      calculateMonthlyExpenses(records.value, 6)
    )

    const typeChartData = computed(() => 
      calculateTypeBreakdown(records.value)
    )

    const mileageChartData = computed(() => 
      calculateMileageTrend(records.value)
    )

    // サマリー統計
    const summary = computed(() => 
      calculateSummary(records.value, settings.value || {})
    )

    // 次回予定
    const upcomingMaintenance = computed(() => 
      getUpcomingMaintenance(records.value, settings.value || {})
    )

    // マウント時：データ読み込み
    onMounted(async () => {
      records.value = await getAllMaintenanceRecords()
      settings.value = await getUserSettings()
    })

    return {
      records,
      settings,
      monthlyChartData,
      typeChartData,
      mileageChartData,
      summary,
      upcomingMaintenance
    }
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.stats-screen {
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

/* セクションタイトル */
.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #2c3e50;
}

/* ==================== チャートセクション ==================== */
.chart-section {
  margin-bottom: 32px;
}

/* ==================== サマリーセクション ==================== */
.summary-section {
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-label {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #7f8c8d;
  font-weight: 500;
}

.stat-value {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #667eea;
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
  margin: 0;
  font-size: 16px;
  color: #34495e;
}

.distance strong {
  font-size: 18px;
  color: #e74c3c;
}

.note {
  margin: 0;
  font-size: 14px;
  color: #34495e;
}

.note strong {
  color: #667eea;
}

/* ==================== 空の状態 ==================== */
.empty-state {
  text-align: center;
  background: white;
  border-radius: 12px;
  padding: 60px 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 32px;
}

.empty-icon {
  font-size: 64px;
  margin: 0 0 16px;
}

.empty-text {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.empty-description {
  margin: 0;
  font-size: 14px;
  color: #95a5a6;
  line-height: 1.6;
}

/* ==================== フッター ==================== */
.footer-space {
  height: 80px;
}

/* ==================== レスポンシブ ==================== */
@media (max-width: 600px) {
  .title {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .main-content {
    padding: 16px 12px;
  }

  .stat-value {
    font-size: 18px;
  }
}
</style>
