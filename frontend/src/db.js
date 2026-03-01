/**
 * IndexDB スキーマ定義（Dexie.js）
 * クルマログ - メンテナンス記録データベース
 */

import Dexie from 'dexie'

// Dexie インスタンス作成
export const db = new Dexie('KurumaLogDB')

// テーブル定義
db.version(1).stores({
  maintenance_records: '++id, date, type',
  user_settings: 'userId'
})

// ==========================================
// 初期設定（デフォルト値）
// ==========================================

const DEFAULT_SETTINGS = {
  userId: 'default',
  fuel_alert_threshold: 25,
  oil_change_interval_km: 5000,
  oil_change_interval_months: 6,
  car_name: '私の車',
  current_mileage: 0,
  created_at: new Date(),
  updated_at: new Date()
}

export async function initializeDB() {
  try {
    const existingSettings = await db.user_settings.get('default')
    if (!existingSettings) {
      await db.user_settings.add(DEFAULT_SETTINGS)
      console.log('[DB] デフォルト設定を初期化しました')
    }
  } catch (error) {
    console.error('[DB] 初期化エラー:', error)
  }
}

export async function addMaintenanceRecord(record) {
  const now = new Date()
  return db.maintenance_records.add({
    ...record,
    date: new Date(record.date),
    created_at: now,
    updated_at: now
  })
}

export async function getAllMaintenanceRecords() {
  return db.maintenance_records.orderBy('date').reverse().toArray()
}

export async function getMaintenanceRecordsByType(type) {
  return db.maintenance_records.where('type').equals(type).reverse().toArray()
}

export async function updateMaintenanceRecord(id, updates) {
  const now = new Date()
  return db.maintenance_records.update(id, {
    ...updates,
    updated_at: now
  })
}

export async function deleteMaintenanceRecord(id) {
  return db.maintenance_records.delete(id)
}

export async function getUserSettings() {
  return db.user_settings.get('default')
}

export async function updateUserSettings(updates) {
  const now = new Date()
  return db.user_settings.update('default', {
    ...updates,
    updated_at: now
  })
}

export async function getLastMaintenanceByType(type) {
  return db.maintenance_records
    .where('type')
    .equals(type)
    .last()
}

export async function getMaintenanceRecordsByDateRange(startDate, endDate) {
  return db.maintenance_records
    .where('date')
    .between(startDate, endDate)
    .toArray()
}

export default db
