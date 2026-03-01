<template>
  <div class="chart-container">
    <h3 class="chart-title">🥧 メンテナンス種類別</h3>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export default {
  name: 'TypeBreakdownChart',
  props: {
    chartData: {
      type: Object,
      required: true,
      default: () => ({ labels: [], data: [], colors: [] })
    }
  },
  setup(props) {
    const chartCanvas = ref(null)
    let chartInstance = null

    onMounted(() => {
      if (chartCanvas.value && props.chartData.labels.length > 0) {
        const ctx = chartCanvas.value.getContext('2d')
        
        chartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: props.chartData.labels,
            datasets: [
              {
                data: props.chartData.data,
                backgroundColor: props.chartData.colors,
                borderColor: 'white',
                borderWidth: 2
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 12,
                  font: {
                    size: 13
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.label || ''
                    const value = context.parsed || 0
                    const total = context.dataset.data.reduce((a, b) => a + b, 0)
                    const percentage = Math.round((value / total) * 100)
                    return `${label}: ¥${value.toLocaleString()} (${percentage}%)`
                  }
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
