// 次回メンテナンス予定を計算
export function calculateNextMaintenance(records, currentMileage, settings) {
  const upcoming = []

  // オイル交換の計算
  const lastOilChange = records.find(r => r.type === 'oil')
  if (lastOilChange) {
    const remainingKm = settings.oil_change_km - (currentMileage - (lastOilChange.mileage || 0))
    const lastChangeDate = new Date(lastOilChange.date)
    const sixMonthsLater = new Date(lastChangeDate.setMonth(lastChangeDate.getMonth() + settings.oil_change_months))
    
    upcoming.push({
      type: 'oil',
      remaining_km: Math.max(0, remainingKm),
      estimated_date: new Date(Math.max(Date.now(), sixMonthsLater.getTime())).toISOString().split('T')[0],
      priority: remainingKm < 1000 ? 'high' : 'medium'
    })
  } else {
    // オイル交換記録がない場合
    upcoming.push({
      type: 'oil',
      remaining_km: settings.oil_change_km,
      estimated_date: 'Unknown',
      priority: 'medium'
    })
  }

  // タイヤ交換の計算
  const lastTireChange = records.find(r => r.type === 'tire')
  if (lastTireChange) {
    const remainingKm = 50000 - (currentMileage - (lastTireChange.mileage || 0))
    upcoming.push({
      type: 'tire',
      remaining_km: Math.max(0, remainingKm),
      estimated_date: new Date(Date.now() + remainingKm * 86400000 / 10000).toISOString().split('T')[0],
      priority: remainingKm < 5000 ? 'high' : 'low'
    })
  } else {
    upcoming.push({
      type: 'tire',
      remaining_km: 50000,
      estimated_date: 'Unknown',
      priority: 'low'
    })
  }

  // 洗車推奨（月1回）
  const lastWash = records.find(r => r.type === 'wash')
  if (lastWash) {
    const daysSinceWash = (Date.now() - new Date(lastWash.date).getTime()) / 86400000
    upcoming.push({
      type: 'wash',
      days_since: Math.floor(daysSinceWash),
      priority: daysSinceWash > 30 ? 'medium' : 'low'
    })
  }

  return upcoming.sort((a, b) => {
    if (a.priority === 'high') return -1
    if (b.priority === 'high') return 1
    return 0
  })
}

// 走行距離の自動提案
export function suggestMileage(records, currentMileage) {
  if (records.length === 0) return currentMileage

  // 最後のガソリン給油から何kmか
  const lastGasoline = records.find(r => r.type === 'gasoline')
  if (!lastGasoline || !lastGasoline.mileage) return currentMileage

  // 過去3ヶ月の月別走行距離を計算
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const recentRecords = records.filter(r => new Date(r.date) > threeMonthsAgo && r.mileage)
  if (recentRecords.length === 0) return currentMileage

  // 平均走行距離を計算
  const totalMileage = recentRecords.reduce((sum, r) => sum + (r.mileage || 0), 0)
  const avgMileagePerMonth = totalMileage / 3

  // 提案値 = 前回走行距離 + 平均走行距離
  return Math.round(lastGasoline.mileage + avgMileagePerMonth)
}
