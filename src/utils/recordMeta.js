export const RECORD_TYPES = [
  { value: 'gasoline', label: 'ガソリン', fullLabel: 'ガソリン', icon: '⛽', group: 'primary' },
  { value: 'odometer', label: '総走行距離', fullLabel: '総走行距離更新', icon: '🛣️', group: 'primary' },
  { value: 'wash', label: '洗車', fullLabel: '洗車', icon: '🧽', group: 'primary' },
  { value: 'coating', label: 'コーティング', fullLabel: 'コーティング', icon: '🛡️', group: 'primary' },
  { value: 'oil', label: 'エンジンオイル', fullLabel: 'エンジンオイル', icon: '🔧', group: 'primary' },
  { value: 'tire', label: 'タイヤ', fullLabel: 'タイヤ', icon: '🛞', group: 'primary' },
  { value: 'inspection', label: '車検・法定点検', fullLabel: '車検・法定点検', icon: '📋', group: 'primary' },
  { value: 'repair', label: '修理・不具合', fullLabel: '修理・不具合', icon: '🛠️', group: 'primary' },
  { value: 'battery', label: 'バッテリー', fullLabel: 'バッテリー', icon: '🔋', group: 'detail' },
  { value: 'oil_filter', label: 'オイルフィルター', fullLabel: 'オイルフィルター', icon: '🧩', group: 'detail' },
  { value: 'ac_filter', label: 'エアコンフィルター', fullLabel: 'エアコンフィルター', icon: '🌬️', group: 'detail' },
  { value: 'wiper_rubber', label: 'ワイパーゴム', fullLabel: 'ワイパーゴム', icon: '🌧️', group: 'detail' },
  { value: 'insurance', label: '保険・税金', fullLabel: '保険・税金', icon: '💰', group: 'detail' },
  { value: 'glass', label: 'ガラス・ワイパー', fullLabel: 'ガラス・ワイパー', icon: '🪟', group: 'detail' },
  { value: 'lamp', label: '電球・ランプ類', fullLabel: '電球・ランプ類', icon: '💡', group: 'detail' },
  { value: 'supplies', label: '消耗品', fullLabel: '消耗品', icon: '🧴', group: 'detail' },
  { value: 'parking', label: '駐車場・高速代', fullLabel: '駐車場・高速代', icon: '🅿️', group: 'detail' },
  { value: 'other', label: 'その他', fullLabel: 'その他', icon: '📍', group: 'detail' }
]

const META_MAP = Object.fromEntries(RECORD_TYPES.map((item) => [item.value, item]))

export function getRecordMeta(type) {
  return META_MAP[type] || { value: type, label: 'その他', fullLabel: 'その他', icon: '📍' }
}
