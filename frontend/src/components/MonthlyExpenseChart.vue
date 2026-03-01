<template>
  <div class="chart-container">
    <h3 class="chart-title">📊 月別支出</h3>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export default {
  name: 'MonthlyExpenseChart',
  props: {
    chartData: {
      type: Object,
      required: true,
      default: () => ({ labels: [], data: [] })
    }
  },
  setup(props) {
    const chartCanvas = ref(null)
    let chartInstance = null

    onMounted(() => {
      if (chartCanvas.value && props.chartData.labels.length > 0) {
        const ctx = chartCanvas.value.getContext('2d')
        
        chartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: props.chartData.labels,
            datasets: [
              {
                label: '月別支出',
                data: props.chartData.data,
                backgroundColor: [
                  '#667eea',
                  '#764ba2',
                  '#667eea',
                  '#764ba2',
                  '#667eea',
                  '#764ba2'
                ],
                borderColor: '#667eea',
                borderWidth: 1,
                borderRadius: 8,
                borderSkipped: false
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => `¥${value.toLocaleString()}`
                }
              }
            }
          }
        })
      }
    })

    return { chartCanvas }
  }
}
</script>

<style scoped>
.chart-container {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
}

.chart-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

canvas {
  max-height: 300px;
}
</style>
