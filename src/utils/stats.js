import { calculateNextMaintenance } from './nextMaintenance'
import { getRecordMeta } from './recordMeta'

function toDate(value) {
  return new Date(`${value}T00:00:00`)
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabelFromKey(key) {
  const [year, month] = key.split('-')
  return `${year}/${month}`
}

function formatCurrency(value) {
  return `¥${Math.round(value || 0).toLocaleString('ja-JP')}`
}

function average(values) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function getTypeMeta(type) {
  const meta = getRecordMeta(type)
  return { label: meta.fullLabel, icon: meta.icon }
}

export function buildStatistics(records = [], settings = {}) {
  const normalizedRecords = [...records]
    .filter((record) => record?.date)
    .sort((a, b) => toDate(a.date) - toDate(b.date))

  const lastSixMonthsKeys = []
  const today = new Date()
  for (let i = 5; i >= 0; i -= 1) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1)
    lastSixMonthsKeys.push(monthKey(month))
  }

  const monthlySpendingMap = new Map(lastSixMonthsKeys.map((key) => [key, 0]))
  const categoryTotalsMap = new Map()
  const monthlyMileageMap = new Map(lastSixMonthsKeys.map((key) => [key, 0]))
  const monthlyEfficiencyMap = new Map(lastSixMonthsKeys.map((key) => [key, []]))

  let totalExpense = 0
  let recordsWithAmount = 0

  normalizedRecords.forEach((record) => {
    const recordDate = toDate(record.date)
    const key = monthKey(recordDate)
    const amount = Number(record.amount) || 0
    const mileage = Number(record.mileage) || 0

    if (amount > 0) {
      totalExpense += amount
      recordsWithAmount += 1
      categoryTotalsMap.set(record.type, (categoryTotalsMap.get(record.type) || 0) + amount)
      if (monthlySpendingMap.has(key)) {
        monthlySpendingMap.set(key, monthlySpendingMap.get(key) + amount)
      }
    }

    if (mileage > 0 && monthlyMileageMap.has(key)) {
      const currentMax = monthlyMileageMap.get(key)
      monthlyMileageMap.set(key, Math.max(currentMax, mileage))
    }
  })

  const gasolineRecords = normalizedRecords.filter((record) => record.type === 'gasoline' && Number(record.mileage) > 0)
  for (let i = 1; i < gasolineRecords.length; i += 1) {
    const previous = gasolineRecords[i - 1]
    const current = gasolineRecords[i]
    const previousMileage = Number(previous.mileage) || 0
    const currentMileage = Number(current.mileage) || 0
    const traveled = currentMileage - previousMileage
    const currentCost = Number(current.amount) || 0
    const litersEstimate = currentCost > 0 ? currentCost / 170 : 0
    const efficiency = litersEstimate > 0 ? traveled / litersEstimate : 0
    const key = monthKey(toDate(current.date))

    if (monthlyEfficiencyMap.has(key) && traveled > 0 && Number.isFinite(efficiency)) {
      monthlyEfficiencyMap.get(key).push(efficiency)
    }
  }

  const monthlySpending = lastSixMonthsKeys.map((key) => ({
    key,
    label: monthLabelFromKey(key),
    amount: Math.round(monthlySpendingMap.get(key) || 0)
  }))

  const mileageTrend = lastSixMonthsKeys.map((key, index) => {
    const currentMileage = monthlyMileageMap.get(key) || 0
    const previousMileage = index === 0 ? 0 : (monthlyMileageMap.get(lastSixMonthsKeys[index - 1]) || 0)
    const delta = currentMileage > 0 && previousMileage > 0 ? currentMileage - previousMileage : 0

    return {
      key,
      label: monthLabelFromKey(key),
      mileage: currentMileage,
      distance: delta > 0 ? delta : 0,
      fuelEfficiency: Number(average(monthlyEfficiencyMap.get(key) || []).toFixed(1))
    }
  })

  const categoryBreakdown = Array.from(categoryTotalsMap.entries())
    .map(([type, amount]) => ({
      type,
      label: getTypeMeta(type).label,
      amount: Math.round(amount)
    }))
    .sort((a, b) => b.amount - a.amount)

  const latestRecord = normalizedRecords.at(-1) || null
  const currentMileage = Number(settings.current_mileage) || Number(latestRecord?.mileage) || 0
  const recentMaintenance = normalizedRecords
    .slice(-5)
    .reverse()
    .map((record) => ({
      id: record.id,
      type: record.type,
      label: getTypeMeta(record.type).label,
      icon: getTypeMeta(record.type).icon,
      date: record.date,
      mileage: Number(record.mileage) || 0,
      amount: Number(record.amount) || 0,
      memo: record.memo || ''
    }))

  const maintenanceSchedule = calculateNextMaintenance([...normalizedRecords].reverse(), currentMileage, settings)
    .slice(0, 4)
    .map((item) => ({
      ...item,
      label: getTypeMeta(item.type).label,
      icon: getTypeMeta(item.type).icon
    }))

  const thisMonthKey = monthKey(today)
  const thisMonthSpending = monthlySpendingMap.get(thisMonthKey) || 0

  return {
    summary: {
      totalRecords: normalizedRecords.length,
      totalExpense: Math.round(totalExpense),
      averageExpense: recordsWithAmount > 0 ? Math.round(totalExpense / recordsWithAmount) : 0,
      thisMonthSpending: Math.round(thisMonthSpending),
      currentMileage,
      latestRecordDate: latestRecord?.date || null,
      latestRecordLabel: latestRecord ? getTypeMeta(latestRecord.type).label : null,
      totalCategories: categoryBreakdown.length
    },
    monthlySpending,
    categoryBreakdown,
    mileageTrend,
    maintenanceSchedule,
    recentMaintenance,
    helpers: {
      formatCurrency
    }
  }
}
