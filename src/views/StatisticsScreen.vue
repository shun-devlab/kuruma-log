<template>
  <div class="statistics-screen">
    <header class="header">
      <div class="header-top">
        <div>
          <h1>📊 統計ダッシュボード</h1>
          <p class="header-subtitle">記録の傾向をひと目で確認</p>
        </div>
      </div>
      <div class="header-date">{{ today }}</div>
    </header>

    <main class="content">
      <section class="summary-grid">
        <article class="summary-card accent">
          <span class="summary-label">今月の支出</span>
          <strong>{{ formatCurrency(stats.summary.thisMonthSpending) }}</strong>
        </article>
        <article class="summary-card">
          <span class="summary-label">累計支出</span>
          <strong>{{ formatCurrency(stats.summary.totalExpense) }}</strong>
        </article>
        <article class="summary-card">
          <span class="summary-label">総記録数</span>
          <strong>{{ stats.summary.totalRecords }}件</strong>
        </article>
        <article class="summary-card">
          <span class="summary-label">現在走行距離</span>
          <strong>{{ stats.summary.currentMileage.toLocaleString('ja-JP') }}km</strong>
        </article>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>月別支出</h2>
            <p>直近6か月の支出推移</p>
          </div>
        </div>
        <div class="chart-wrap">
          <Bar :data="monthlySpendingData" :options="barOptions" />
        </div>
      </section>

      <section class="panel two-column">
        <article class="panel nested-panel">
          <div class="panel-header">
            <div>
              <h2>支出カテゴリ比率</h2>
              <p>どこにお金がかかっているか</p>
            </div>
          </div>
          <div v-if="stats.categoryBreakdown.length > 0" class="chart-wrap pie-wrap">
            <Pie :data="categoryPieData" :options="pieOptions" />
          </div>
          <div v-else class="empty-state">支出データがまだありません。</div>
        </article>

        <article class="panel nested-panel">
          <div class="panel-header">
            <div>
              <h2>カテゴリ別サマリー</h2>
              <p>累計金額の大きい順</p>
            </div>
          </div>
          <div v-if="stats.categoryBreakdown.length > 0" class="category-list">
            <div v-for="item in stats.categoryBreakdown" :key="item.type" class="category-item">
              <div>
                <strong>{{ item.label }}</strong>
                <span>{{ item.type }}</span>
              </div>
              <strong>{{ formatCurrency(item.amount) }}</strong>
            </div>
          </div>
          <div v-else class="empty-state">カテゴリ集計がありません。</div>
        </article>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>走行距離・燃費トレンド</h2>
            <p>月次の走行距離差分と推定燃費</p>
          </div>
        </div>
        <div class="chart-wrap tall">
          <Line :data="mileageTrendData" :options="lineOptions" />
        </div>
      </section>

      <section class="panel two-column">
        <article class="panel nested-panel">
          <div class="panel-header">
            <div>
              <h2>最近のメンテナンス</h2>
              <p>最新5件</p>
            </div>
          </div>
          <div v-if="stats.recentMaintenance.length > 0" class="timeline-list">
            <div v-for="item in stats.recentMaintenance" :key="item.id" class="timeline-item">
              <div class="timeline-icon">{{ item.icon }}</div>
              <div class="timeline-body">
                <strong>{{ item.label }}</strong>
                <div>{{ item.date }}</div>
                <div v-if="item.mileage">{{ item.mileage.toLocaleString('ja-JP') }}km</div>
                <div v-if="item.amount">{{ formatCurrency(item.amount) }}</div>
                <div v-if="item.memo" class="memo">{{ item.memo }}</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">まだ記録がありません。</div>
        </article>

        <article class="panel nested-panel">
          <div class="panel-header">
            <div>
              <h2>メンテ予定</h2>
              <p>次回の目安</p>
            </div>
          </div>
          <div v-if="stats.maintenanceSchedule.length > 0" class="schedule-list">
            <div v-for="item in stats.maintenanceSchedule" :key="item.type" class="schedule-item">
              <div class="schedule-head">
                <span class="schedule-icon">{{ item.icon }}</span>
                <strong>{{ item.label }}</strong>
                <span class="priority" :class="item.priority">{{ priorityLabel(item.priority) }}</span>
              </div>
              <div class="schedule-meta" v-if="item.remaining_km !== undefined">あと {{ item.remaining_km.toLocaleString('ja-JP') }}km</div>
              <div class="schedule-meta" v-if="item.days_since !== undefined">前回から {{ item.days_since }}日</div>
              <div class="schedule-meta" v-if="item.estimated_date">目安: {{ item.estimated_date }}</div>
            </div>
          </div>
          <div v-else class="empty-state">予定データがありません。</div>
        </article>
      </section>
    </main>
  </div>
</template>

<script>
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip
} from 'chart.js'
import { Bar, Line, Pie } from 'vue-chartjs'
import { buildStatistics } from '../utils/stats'

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip
)

const COLORS = ['#FF9500', '#4A90E2', '#34C759', '#AF52DE', '#FF3B30']

export default {
  components: {
    Bar,
    Line,
    Pie
  },
  props: {
    records: {
      type: Array,
      default: () => []
    },
    settings: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['back'],
  computed: {
    today() {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    stats() {
      return buildStatistics(this.records, this.settings)
    },
    monthlySpendingData() {
      return {
        labels: this.stats.monthlySpending.map((item) => item.label),
        datasets: [
          {
            label: '支出',
            data: this.stats.monthlySpending.map((item) => item.amount),
            backgroundColor: '#FFB347',
            borderColor: '#FF9500',
            borderRadius: 10,
            borderSkipped: false
          }
        ]
      }
    },
    categoryPieData() {
      return {
        labels: this.stats.categoryBreakdown.map((item) => item.label),
        datasets: [
          {
            data: this.stats.categoryBreakdown.map((item) => item.amount),
            backgroundColor: COLORS,
            borderWidth: 0
          }
        ]
      }
    },
    mileageTrendData() {
      return {
        labels: this.stats.mileageTrend.map((item) => item.label),
        datasets: [
          {
            label: '月間走行距離',
            data: this.stats.mileageTrend.map((item) => item.distance),
            borderColor: '#4A90E2',
            backgroundColor: 'rgba(74, 144, 226, 0.15)',
            fill: true,
            tension: 0.35,
            yAxisID: 'y'
          },
          {
            label: '推定燃費(km/L)',
            data: this.stats.mileageTrend.map((item) => item.fuelEfficiency),
            borderColor: '#34C759',
            backgroundColor: '#34C759',
            tension: 0.35,
            yAxisID: 'y1'
          }
        ]
      }
    },
    barOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            ticks: {
              callback: (value) => `¥${Number(value).toLocaleString('ja-JP')}`
            }
          }
        }
      }
    },
    pieOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    },
    lineOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          y: {
            position: 'left',
            title: {
              display: true,
              text: '走行距離 (km)'
            }
          },
          y1: {
            position: 'right',
            grid: {
              drawOnChartArea: false
            },
            title: {
              display: true,
              text: '燃費 (km/L)'
            }
          }
        }
      }
    }
  },
  methods: {
    formatCurrency(value) {
      return `¥${Math.round(value || 0).toLocaleString('ja-JP')}`
    },
    priorityLabel(priority) {
      return {
        high: '優先',
        medium: '注意',
        low: '通常'
      }[priority] || '通常'
    }
  }
}
</script>

<style scoped>
.statistics-screen {
  min-height: 100vh;
  background: #ffffff;
}

.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ffffff;
  border-bottom: 1px solid #dddddd;
  padding: 16px;
}

.header-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-back {
  border: 1px solid #dddddd;
  background: #ffffff;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 18px;
}

.header h1 {
  font-size: 20px;
}

.header-subtitle,
.header-date {
  color: #666666;
  font-size: 13px;
}

.header-date {
  margin-top: 8px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary-card,
.panel {
  background: #f8f8f8;
  border: 1px solid #eeeeee;
  border-radius: 16px;
  padding: 16px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-card strong {
  font-size: 20px;
}

.summary-card.accent {
  background: #fff3e0;
  border-color: #ffd39a;
}

.summary-label {
  font-size: 13px;
  color: #666666;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-header h2 {
  font-size: 16px;
  margin-bottom: 4px;
}

.panel-header p {
  color: #666666;
  font-size: 13px;
}

.chart-wrap {
  position: relative;
  height: 240px;
}

.chart-wrap.tall {
  height: 300px;
}

.pie-wrap {
  height: 280px;
}

.two-column {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.nested-panel {
  margin: 0;
}

.category-list,
.timeline-list,
.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item,
.timeline-item,
.schedule-item {
  background: #ffffff;
  border: 1px solid #eeeeee;
  border-radius: 12px;
  padding: 12px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.category-item span {
  display: block;
  margin-top: 4px;
  color: #999999;
  font-size: 12px;
}

.timeline-item {
  display: flex;
  gap: 12px;
}

.timeline-icon,
.schedule-icon {
  font-size: 22px;
}

.timeline-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.memo {
  color: #666666;
}

.schedule-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.schedule-meta {
  font-size: 13px;
  color: #666666;
  margin-top: 4px;
}

.priority {
  margin-left: auto;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
}

.priority.high {
  background: #ffe2df;
  color: #d63031;
}

.priority.medium {
  background: #fff0d6;
  color: #c27c00;
}

.priority.low {
  background: #e8f5e9;
  color: #2f855a;
}

.empty-state {
  color: #999999;
  text-align: center;
  padding: 24px 12px;
}

@media (max-width: 768px) {
  .header {
    padding: 12px;
  }

  .content {
    padding: 12px;
    gap: 12px;
  }

  .summary-card,
  .panel {
    padding: 14px;
  }

  .chart-wrap {
    height: 220px;
  }

  .chart-wrap.tall,
  .pie-wrap {
    height: 260px;
  }

  .panel-header {
    flex-direction: column;
  }
}

@media (min-width: 768px) {
  .app,
  .statistics-screen {
    max-width: 100%;
  }

  .two-column {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
