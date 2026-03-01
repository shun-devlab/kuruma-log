<template>
  <div class="chart-container">
    <h3 class="chart-title">📈 走行距離・燃費推移（直近10回）</h3>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export default {
  name: 'MileageTrendChart',
  props: {
    chartData: {
      type: Object,
      required: true,
      default: () => ({ labels: [], mileages: [], avgFuels: [] })
    }
  },
  setup(props) {
    const chartCanvas = ref(null)
    let chartInstance = null

    onMounted(() => {
      if (chartCanvas.value && props.chartData.labels.length > 0) {
        const ctx = chartCanvas.value.getContext('2d')
        
        chartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: props.chartData.labels,
            datasets: [
              {
                label: '給油量 (L)',
                data: props.chartData.mileages,
                borderColor: '#36A2EB',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                yAxisID: 'y'
              },
              {
                label: '平均燃費 (km/L)',
                data: props.chartData.avgFuels,
                borderColor: '#4BC0C0',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                yAxisID: 'y1'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
              mode: 'index',
              intersect: false
            },
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 12,
                  font: {
                    size: 13
                  }
                }
              }
            },
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                  display: true,
                  text: '給油量 (L)'
                }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                  display: true,
                  text: '燃費 (km/L)'
                },
                grid: {
                  drawOnChartArea: false
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
