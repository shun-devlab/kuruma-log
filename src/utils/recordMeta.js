export const RECORD_TYPES = [
  { value: 'gasoline', label: 'ガソリン', fullLabel: 'ガソリン', icon: '⛽' },
  { value: 'wash', label: '洗車', fullLabel: '洗車', icon: '🚗' },
  { value: 'oil', label: 'エンジンオイル', fullLabel: 'エンジンオイル', icon: '🔧' },
  { value: 'tire', label: 'タイヤ', fullLabel: 'タイヤ', icon: '🔄' },
  { value: 'inspection', label: '車検・法定点検', fullLabel: '車検・法定点検', icon: '📋' },
  { value: 'repair', label: '修理・不具合', fullLabel: '修理・不具合', icon: '🛠️' },
  { value: 'battery', label: 'バッテリー', fullLabel: 'バッテリー', icon: '🔋' },
  { value: 'insurance', label: '保険・税金', fullLabel: '保険・税金', icon: '💰' },
  { value: 'glass', label: 'ガラス・ワイパー', fullLabel: 'ガラス・ワイパー', icon: '🪟' },
  { value: 'lamp', label: '電球・ランプ類', fullLabel: '電球・ランプ類', icon: '💡' },
  { value: 'supplies', label: '消耗品', fullLabel: '消耗品', icon: '🧴' },
  { value: 'parking', label: '駐車場・高速代', fullLabel: '駐車場・高速代', icon: '🅿️' },
  { value: 'other', label: 'その他', fullLabel: 'その他', icon: '📍' }
]

const META_MAP = Object.fromEntries(RECORD_TYPES.map((item) => [item.value, item]))

export function getRecordMeta(type) {
  return META_MAP[type] || { value: type, label: 'その他', fullLabel: 'その他', icon: '📍' }
}
