<template>
  <div class="settings-screen">
    <header class="header">
      <div class="header-top">
        <button class="btn-back" @click="$emit('back')">←</button>
        <div>
          <h1>⚙️ 設定</h1>
          <p class="header-subtitle">記録しやすさとバックアップを整える</p>
        </div>
      </div>
    </header>

    <main class="content">
      <section class="panel">
        <h2>基本設定</h2>
        <div class="form-grid">
          <label>
            車の名前
            <input v-model.trim="form.car_name" type="text" placeholder="例: フィット" />
          </label>
          <label>
            オイル交換目安(km)
            <input v-model.number="form.oil_change_km" type="number" min="0" step="500" />
          </label>
          <label>
            オイル交換目安(月)
            <input v-model.number="form.oil_change_months" type="number" min="1" max="24" />
          </label>
          <label>
            タイヤ交換目安(km)
            <input v-model.number="form.tire_change_km" type="number" min="0" step="1000" />
          </label>
          <label>
            洗車リマインド(日)
            <input v-model.number="form.wash_interval_days" type="number" min="1" max="90" />
          </label>
        </div>
      </section>

      <section class="panel preview-panel">
        <h2>保存プレビュー</h2>
        <div class="preview-grid">
          <div>
            <span class="preview-label">車名</span>
            <strong>{{ form.car_name || '未設定' }}</strong>
          </div>
          <div>
            <span class="preview-label">オイル交換</span>
            <strong>{{ form.oil_change_km }}km / {{ form.oil_change_months }}か月</strong>
          </div>
          <div>
            <span class="preview-label">タイヤ交換</span>
            <strong>{{ Number(form.tire_change_km || 0).toLocaleString('ja-JP') }}km</strong>
          </div>
          <div>
            <span class="preview-label">洗車リマインド</span>
            <strong>{{ form.wash_interval_days }}日ごと</strong>
          </div>
        </div>
        <button class="btn-secondary" @click="resetDefaults">初期値に戻す</button>
      </section>

      <section class="panel">
        <h2>記録カテゴリの並び順</h2>
        <div class="category-sort-list">
          <div v-for="(type, index) in form.record_order" :key="type" class="category-sort-item">
            <div class="category-sort-label">{{ getCategoryLabel(type) }}</div>
            <div class="category-sort-actions">
              <button class="btn-secondary small" :disabled="index === 0" @click="moveCategory(index, -1)">↑</button>
              <button class="btn-secondary small" :disabled="index === form.record_order.length - 1" @click="moveCategory(index, 1)">↓</button>
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <h2>データ管理</h2>
        <div class="data-actions">
          <button class="btn-primary" @click="exportJson">JSONを書き出す</button>
          <label class="btn-secondary upload-button">
            JSONを読み込む
            <input ref="fileInput" type="file" accept="application/json" @change="importJson" />
          </label>
        </div>
        <p class="helper">設定と記録をまとめてバックアップ / 復元できます。</p>
        <div v-if="message" class="message">{{ message }}</div>
      </section>

      <div class="actions">
        <button class="btn-secondary" @click="$emit('back')">戻る</button>
        <button class="btn-primary" @click="save">保存する</button>
      </div>
    </main>
  </div>
</template>

<script>
import { maintenanceStore, settingsStore } from '../stores/db'
import { RECORD_TYPES, getRecordMeta } from '../utils/recordMeta'

const DEFAULT_SETTINGS = {
  car_name: '私の車',
  current_mileage: 0,
  oil_change_km: 5000,
  oil_change_months: 6,
  fuel_alert_threshold: 25,
  tire_change_km: 50000,
  wash_interval_days: 30,
  record_order: RECORD_TYPES.map((item) => item.value)
}

export default {
  props: {
    settings: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['back', 'saved'],
  data() {
    return {
      form: {
        ...DEFAULT_SETTINGS
      },
      message: ''
    }
  },
  mounted() {
    this.form = {
      ...DEFAULT_SETTINGS,
      ...this.settings,
      current_mileage: Number(this.settings.current_mileage) || 0,
      oil_change_km: Number(this.settings.oil_change_km) || DEFAULT_SETTINGS.oil_change_km,
      oil_change_months: Number(this.settings.oil_change_months) || DEFAULT_SETTINGS.oil_change_months,
      fuel_alert_threshold: Number(this.settings.fuel_alert_threshold) || DEFAULT_SETTINGS.fuel_alert_threshold,
      tire_change_km: Number(this.settings.tire_change_km) || DEFAULT_SETTINGS.tire_change_km,
      wash_interval_days: Number(this.settings.wash_interval_days) || DEFAULT_SETTINGS.wash_interval_days,
      record_order: Array.isArray(this.settings.record_order) && this.settings.record_order.length
        ? [
            ...this.settings.record_order.filter((value) => DEFAULT_SETTINGS.record_order.includes(value)),
            ...DEFAULT_SETTINGS.record_order.filter((value) => !this.settings.record_order.includes(value))
          ]
        : [...DEFAULT_SETTINGS.record_order]
    }
  },
  methods: {
    async save() {
      await settingsStore.save({
        ...this.form,
        record_order: [...this.form.record_order]
      })
      this.message = '設定を保存しました。'
      window.alert('設定を保存しました。')
      this.$emit('saved')
    },
    async exportJson() {
      const records = await maintenanceStore.getAll()
      const payload = {
        exported_at: new Date().toISOString(),
        settings: this.form,
        records
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kuruma-log-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      this.message = 'JSONバックアップを書き出しました。'
    },
    async importJson(event) {
      const file = event.target.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const payload = JSON.parse(text)
        if (payload.settings) {
          this.form = {
            ...this.form,
            ...payload.settings
          }
          await settingsStore.save(this.form)
        }
        if (Array.isArray(payload.records)) {
          await maintenanceStore.replaceAll(payload.records)
        }
        this.message = 'JSONバックアップを読み込みました。'
        window.alert('JSONの読み込みに成功しました。')
        this.$emit('saved')
      } catch (error) {
        console.error(error)
        this.message = 'JSONの読み込みに失敗しました。'
        window.alert('JSONの読み込みに失敗しました。ファイル形式を確認してください。')
      } finally {
        if (this.$refs.fileInput) this.$refs.fileInput.value = ''
      }
    },
    resetDefaults() {
      this.form = {
        ...DEFAULT_SETTINGS,
        record_order: [...DEFAULT_SETTINGS.record_order]
      }
      this.message = '初期値をフォームに反映しました。保存すると適用されます。'
    },
    moveCategory(index, direction) {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= this.form.record_order.length) return
      const order = [...this.form.record_order]
      const [item] = order.splice(index, 1)
      order.splice(nextIndex, 0, item)
      this.form.record_order = order
    },
    getCategoryLabel(type) {
      const meta = getRecordMeta(type)
      return `${meta.icon} ${meta.fullLabel}`
    }
  }
}
</script>

<style scoped>
.settings-screen {
  min-height: 100vh;
  background: #f8f8f8;
}
.header {
  background: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  padding: 16px;
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-top {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.btn-back {
  border: none;
  background: #f2f2f2;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
}
.header h1 {
  font-size: 22px;
  margin-bottom: 4px;
}
.header-subtitle {
  color: #666666;
  font-size: 13px;
}
.content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.panel {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}
.panel h2 {
  margin-bottom: 12px;
}
.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}
.preview-grid > div {
  background: #f8f8f8;
  border-radius: 12px;
  padding: 12px;
}
.preview-label {
  display: block;
  font-size: 12px;
  color: #666666;
  margin-bottom: 6px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}
input {
  width: 100%;
  padding: 12px;
  border: 1px solid #dddddd;
  border-radius: 10px;
  background: #ffffff;
}
.category-sort-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-sort-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: #f8f8f8;
  border-radius: 12px;
  padding: 10px 12px;
}

.category-sort-label {
  font-size: 14px;
  font-weight: 600;
}

.category-sort-actions {
  display: flex;
  gap: 8px;
}

.data-actions,
.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.small {
  padding: 8px 12px;
  min-width: 44px;
  min-height: 36px;
  line-height: 1;
  font-size: 14px;
  font-weight: 700;
}

.small:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-primary,
.btn-secondary,
.upload-button {
  border: none;
  border-radius: 10px;
  padding: 12px 16px;
  cursor: pointer;
  font-weight: 600;
}
.btn-primary {
  background: #ff9500;
  color: #ffffff;
}
.btn-secondary,
.upload-button {
  background: #f2f2f2;
  color: #333333;
}
.upload-button input {
  display: none;
}
.helper,
.message {
  margin-top: 12px;
  color: #666666;
}
.message {
  color: #ff9500;
  font-weight: 600;
}
@media (max-width: 768px) {
  .header {
    padding: 12px;
  }

  .content {
    padding: 12px;
    gap: 12px;
  }

  .panel {
    padding: 14px;
  }
}

@media (max-width: 640px) {
  .form-grid,
  .preview-grid {
    grid-template-columns: 1fr;
  }
  .data-actions,
  .actions {
    flex-direction: column;
  }
}
</style>
