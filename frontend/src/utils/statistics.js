/**
 * 統計計算ユーティリティ
 * クルマログの各種統計情報を計算
 */

/**
 * 月別支出の集計
 * @param {Array} records - メンテナンス記録
 * @param {number} months - 過去何ヶ月を対象にするか（デフォルト6）
 * @returns {Object} { labels: [], data: [] }
 */
export function calculateMonthlyExpenses(records, months = 6) {
  const now = new Date()
  const labels = []
  const data = []

  // 過去N個月のラベルとデータを生成
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    labels.push(`${year}/${month}`)

    // その月の全支出を集計
    const monthlyTotal = records
      .filter(r => {
        const recordDate = new Date(r.date)
        return (
          recordDate.getFullYear() === year &&
          recordDate.getMonth() + 1 === month &&
          r.amount > 0
        )
      })
      .reduce((sum, r) => sum + (r.amount || 0), 0)

    data.push(monthlyTotal)
  }

  return { labels, data }
}

/**
 * メンテナンス種類別の支出集計
 * @param {Array} records - メンテナンス記録
 * @returns {Object} { labels: [], data: [], colors: [] }
 */
export function calculateTypeBreakdown(records) {
  const typeMap = {
    gasoline: { label: 'ガソリン給油', icon: '⛽', color: '#FF6384' },
    oil: { label: 'オイル交換', icon: '🛢️', color: '#36A2EB' },
    tire: { label: 'タイヤ交換', icon: '🛞', color: '#FFCE56' },
    wash: { label: '洗車', icon: '🚿', color: '#4BC0C0' },
    repair: { label: '故障・修理', icon: '⚠️', color: '#FF9F40' }
  }

  const totals = {}

  // 種類別に集計
  records.forEach(r => {
    const type = r.type
    if (!totals[type]) {
      totals[type] = 0
    }
    totals[type] += r.amount || 0
  })

  // 0円の種類は除外、データに変換
  const labels = []
  const data = []
  const colors = []

  Object.entries(totals).forEach(([type, amount]) => {
    if (amount > 0) {
      labels.push(typeMap[type]?.label || type)
      data.push(amount)
      colors.push(typeMap[type]?.color || '#999')
    }
  })

  return { labels, data, colors }
}

/**
 * 走行距離とガソリン消費の計算
 * 最新10件のガソリン給油レコードを対象
 * @param {Array} records - メンテナンス記録
 * @returns {Object} { labels: [], mileages: [], avgFuels: [] }
 */
export function calculateMileageTrend(records) {
  // ガソリン給油レコードのみを日付降順で取得
  const gasRecords = records
    .filter(r => r.type === 'gasoline')
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  // 最新10件を取得
  const latest10 = gasRecords.slice(Math.max(0, gasRecords.length - 10))

  const labels = []
  const mileages = []
  const avgFuels = []

  latest10.forEach((record, index) => {
    // ラベル: 日付
    const date = new Date(record.date)
    labels.push(`${date.getMonth() + 1}/${date.getDate()}`)

    // 走行距離（給油量？）
    mileages.push(record.mileage || 0)

    // 平均燃費: 前回の走行距離 / 今回の給油量
    if (index > 0 && latest10[index - 1].mileage && record.mileage) {
      const distance = latest10[index - 1].mileage || 1
      const fuelAmount = record.mileage || 1
      const avgFuel = (distance / fuelAmount).toFixed(2)
      avgFuels.push(parseFloat(avgFuel))
    } else {
      avgFuels.push(0)
    }
  })

  return { labels, mileages, avgFuels }
}

/**
 * 統計サマリーの計算
 * @param {Array} records - メンテナンス記録
 * @param {Object} settings - ユーザー設定
 * @returns {Object} summary統計情報
 */
export function calculateSummary(records, settings = {}) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // 総支出（全期間）
  const totalExpense = records.reduce((sum, r) => sum + (r.amount || 0), 0)

  // 今月の支出
  const monthlyExpense = records
    .filter(r => {
      const recordDate = new Date(r.date)
      return (
        recordDate.getFullYear() === currentYear &&
        recordDate.getMonth() + 1 === currentMonth
      )
    })
    .reduce((sum, r) => sum + (r.amount || 0), 0)

  // 平均月額支出
  const monthCount = records.length > 0
    ? Math.max(1, getMonthsBetween(
        new Date(records[records.length - 1].date),
        new Date(records[0].date)
      ) + 1)
    : 1
  const averageMonthlyExpense = Math.round(totalExpense / monthCount)

  // 総走行距離（最大走行距離を総走行距離と見なす）
  const totalMileage = Math.max(0, ...records.map(r => r.mileage || 0))

  // 平均燃費
  const gasRecords = records.filter(r => r.type === 'gasoline')
  let averageFuel = 0
  if (gasRecords.length > 0) {
    // 最初と最後の走行距離の差 / 総給油量
    const distances = records
      .filter(r => r.mileage)
      .map(r => r.mileage)
      .sort((a, b) => a - b)
    
    if (distances.length > 1) {
      const totalDistance = distances[distances.length - 1] - distances[0]
      const totalGasoline = gasRecords.reduce((sum, r) => sum + (r.mileage || 0), 0)
      averageFuel = totalGasoline > 0 ? (totalDistance / totalGasoline).toFixed(2) : 0
    }
  }

  return {
    totalExpense,
    monthlyExpense,
    averageMonthlyExpense,
    totalMileage,
    averageFuel: parseFloat(averageFuel)
  }
}

/**
 * 2つの日付の間の月数を計算
 * @param {Date} start
 * @param {Date} end
 * @returns {number} 月数
 */
function getMonthsBetween(start, end) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  let months = 0
  
  while (startDate < endDate) {
    startDate.setMonth(startDate.getMonth() + 1)
    months++
  }
  
  return months
}

/**
 * 最近のメンテナンス予定を取得
 * @param {Array} records - メンテナンス記録
 * @param {Object} settings - ユーザー設定
 * @returns {Object} upcoming予定情報
 */
export function getUpcomingMaintenance(records, settings = {}) {
  const upcoming = {}

  // オイル交換
  const lastOil = records.find(r => r.type === 'oil')
  if (lastOil) {
    const nextDistance = lastOil.mileage + (settings.oil_change_interval_km || 5000)
    const currentMileage = settings.current_mileage || 0
    upcoming.oil = {
      distance: Math.max(0, nextDistance - currentMileage),
      date: new Date(lastOil.date).toLocaleDateString('ja-JP')
    }
  }

  // タイヤ交換
  const lastTire = records.find(r => r.type === 'tire')
  if (lastTire) {
    const nextDistance = lastTire.mileage + 50000
    const currentMileage = settings.current_mileage || 0
    upcoming.tire = {
      distance: Math.max(0, nextDistance - currentMileage),
      date: new Date(lastTire.date).toLocaleDateString('ja-JP')
    }
  }

  // 洗車
  const lastWash = records.find(r => r.type === 'wash')
  if (lastWash) {
    const now = new Date()
    const lastDate = new Date(lastWash.date)
    const days = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24))
    upcoming.wash = { days }
  }

  return upcoming
}
