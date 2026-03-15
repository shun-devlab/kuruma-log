import Dexie from 'dexie'

// IndexDB データベース初期化
export const db = new Dexie('KurmalogDB')

db.version(1).stores({
  maintenance_records: '++id, date',
  user_settings: 'key'
})

// CRUD 操作
export const maintenanceStore = {
  // 全記録取得
  async getAll() {
    return await db.maintenance_records.orderBy('date').reverse().toArray()
  },

  // 新規記録追加
  async add(record) {
    return await db.maintenance_records.add({
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  },

  // 記録更新
  async update(id, record) {
    return await db.maintenance_records.update(id, {
      ...record,
      updated_at: new Date().toISOString()
    })
  },

  // 記録削除
  async delete(id) {
    return await db.maintenance_records.delete(id)
  },

  // 記録取得（ID指定）
  async getById(id) {
    return await db.maintenance_records.get(id)
  },

  // 種別でフィルタ
  async getByType(type) {
    return await db.maintenance_records.where('type').equals(type).toArray()
  },

  // ダッシュボード表示用データ一括取得
  async getDashboardData() {
    const [records, settings] = await Promise.all([
      db.maintenance_records.orderBy('date').reverse().toArray(),
      settingsStore.get()
    ])

    return {
      records,
      settings
    }
  }
}

// ユーザー設定
export const settingsStore = {
  // 設定取得
  async get() {
    const setting = await db.user_settings.get('config')
    return setting || {
      car_name: '私の車',
      current_mileage: 0,
      oil_change_km: 5000,
      oil_change_months: 6,
      fuel_alert_threshold: 25
    }
  },

  // 設定保存
  async save(settings) {
    return await db.user_settings.put({ key: 'config', ...settings })
  }
}

// 初期化
export async function initDatabase() {
  const setting = await settingsStore.get()
  console.log('Database initialized:', setting)
}
