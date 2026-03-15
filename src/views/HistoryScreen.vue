<template>
  <div class="history-screen">
    <header class="header">
      <div class="header-top">
        <button class="btn-back" @click="$emit('back')">←</button>
        <div>
          <h1>📚 記録一覧</h1>
          <p class="header-subtitle">あとから見返しやすい履歴ビュー</p>
        </div>
      </div>
    </header>

    <main class="content">
      <section class="filter-panel">
        <div class="filter-group search-group">
          <label for="search">検索</label>
          <input
            id="search"
            v-model.trim="searchQuery"
            type="text"
            placeholder="メモ・種類・日付で検索"
          />
        </div>

        <div class="filter-row">
          <div class="filter-group">
            <label for="type">種別</label>
            <select id="type" v-model="selectedType">
              <option value="all">すべて</option>
              <option v-for="option in typeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label for="month">月</label>
            <select id="month" v-model="selectedMonth">
              <option value="all">すべて</option>
              <option v-for="month in monthOptions" :key="month" :value="month">
                {{ month }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label for="sort">並び順</label>
            <select id="sort" v-model="sortOrder">
              <option value="desc">新しい順</option>
              <option value="asc">古い順</option>
            </select>
          </div>
        </div>
      </section>

      <section class="summary-strip">
        <div class="summary-card accent">
          <span>表示件数</span>
          <strong>{{ filteredRecords.length }}件</strong>
        </div>
        <div class="summary-card">
          <span>表示中の支出</span>
          <strong>{{ formatCurrency(filteredExpense) }}</strong>
        </div>
      </section>

      <section class="list-panel">
        <div v-if="filteredRecords.length === 0" class="empty-state">
          条件に合う記録がありません。
        </div>

        <article
          v-for="record in filteredRecords"
          :key="record.id"
          class="record-card"
          :class="{ active: selectedRecord && selectedRecord.id === record.id }"
          @click="selectedRecord = record"
        >
          <div class="record-top">
            <div>
              <div class="record-label">{{ getIcon(record.type) }} {{ getLabel(record.type) }}</div>
              <div class="record-date">{{ formatDate(record.date) }}</div>
            </div>
            <div class="record-amount" v-if="record.amount">{{ formatCurrency(record.amount) }}</div>
          </div>
          <div class="record-meta">
            <span v-if="record.mileage">{{ Number(record.mileage).toLocaleString('ja-JP') }}km</span>
            <span v-if="record.memo">{{ record.memo }}</span>
            <span v-if="!record.mileage && !record.memo">メモなし</span>
          </div>
        </article>
      </section>

      <section v-if="selectedRecord" class="detail-panel">
        <div class="detail-header">
          <div>
            <h2>詳細</h2>
            <p>{{ getLabel(selectedRecord.type) }}</p>
          </div>
          <div class="detail-actions">
            <button class="btn-edit-detail" @click="$emit('edit-record', selectedRecord)">編集する</button>
            <button class="btn-close" @click="selectedRecord = null">閉じる</button>
          </div>
        </div>

        <dl class="detail-grid">
          <div>
            <dt>日付</dt>
            <dd>{{ formatDate(selectedRecord.date) }}</dd>
          </div>
          <div>
            <dt>種別</dt>
            <dd>{{ getLabel(selectedRecord.type) }}</dd>
          </div>
          <div>
            <dt>走行距離</dt>
            <dd>{{ selectedRecord.mileage ? `${Number(selectedRecord.mileage).toLocaleString('ja-JP')}km` : '未入力' }}</dd>
          </div>
          <div>
            <dt>金額</dt>
            <dd>{{ selectedRecord.amount ? formatCurrency(selectedRecord.amount) : '未入力' }}</dd>
          </div>
          <div class="full-width">
            <dt>メモ</dt>
            <dd>{{ selectedRecord.memo || 'なし' }}</dd>
          </div>
        </dl>
      </section>
    </main>
  </div>
</template>

<script>
const TYPE_OPTIONS = [
  { value: 'gasoline', label: 'ガソリン給油' },
  { value: 'oil', label: 'オイル交換' },
  { value: 'tire', label: 'タイヤ交換' },
  { value: 'wash', label: '洗車' },
  { value: 'repair', label: '故障・修理' }
]

export default {
  props: {
    records: {
      type: Array,
      default: () => []
    }
  },
  emits: ['back', 'edit-record'],
  data() {
    return {
      searchQuery: '',
      selectedType: 'all',
      selectedMonth: 'all',
      sortOrder: 'desc',
      selectedRecord: null
    }
  },
  computed: {
    typeOptions() {
      return TYPE_OPTIONS
    },
    monthOptions() {
      return [...new Set(this.records.map((record) => `${record.date.slice(0, 7)}`))].sort().reverse()
    },
    filteredRecords() {
      const query = this.searchQuery.toLowerCase()
      const filtered = this.records.filter((record) => {
        const matchesType = this.selectedType === 'all' || record.type === this.selectedType
        const matchesMonth = this.selectedMonth === 'all' || record.date.startsWith(this.selectedMonth)
        const searchable = [
          this.getLabel(record.type),
          record.type,
          record.date,
          record.memo || ''
        ].join(' ').toLowerCase()
        const matchesQuery = !query || searchable.includes(query)
        return matchesType && matchesMonth && matchesQuery
      })

      return filtered.sort((a, b) => {
        const left = new Date(`${a.date}T00:00:00`).getTime()
        const right = new Date(`${b.date}T00:00:00`).getTime()
        return this.sortOrder === 'desc' ? right - left : left - right
      })
    },
    filteredExpense() {
      return this.filteredRecords.reduce((sum, record) => sum + (Number(record.amount) || 0), 0)
    }
  },
  watch: {
    filteredRecords: {
      immediate: true,
      handler(records) {
        if (!records.length) {
          this.selectedRecord = null
          return
        }
        if (!this.selectedRecord || !records.some((record) => record.id === this.selectedRecord.id)) {
          this.selectedRecord = records[0]
        }
      }
    }
  },
  methods: {
    getIcon(type) {
      return {
        gasoline: '⛽',
        oil: '🛢️',
        tire: '🛞',
        wash: '🚿',
        repair: '⚠️'
      }[type] || '📝'
    },
    getLabel(type) {
      return {
        gasoline: 'ガソリン給油',
        oil: 'オイル交換',
        tire: 'タイヤ交換',
        wash: '洗車',
        repair: '故障・修理'
      }[type] || 'その他'
    },
    formatDate(dateString) {
      const date = new Date(`${dateString}T00:00:00`)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },
    formatCurrency(value) {
      return `¥${Math.round(Number(value) || 0).toLocaleString('ja-JP')}`
    }
  }
}
</script>

<style scoped>
.history-screen {
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

.btn-back,
.btn-close {
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

.filter-panel,
.list-panel,
.detail-panel,
.summary-strip {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  background: #f7f7f7;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-card.accent {
  background: #fff3e0;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.search-group {
  margin-bottom: 12px;
}

input,
select {
  width: 100%;
  padding: 12px;
  border: 1px solid #dddddd;
  border-radius: 10px;
  background: #ffffff;
}

.record-card {
  border: 1px solid #ececec;
  border-radius: 14px;
  padding: 14px;
  cursor: pointer;
}

.record-card + .record-card {
  margin-top: 12px;
}

.record-card.active {
  border-color: #ff9500;
  background: #fffaf2;
}

.record-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.record-label {
  font-weight: 700;
}

.record-date,
.record-meta {
  color: #666666;
  font-size: 13px;
}

.record-meta {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.record-amount {
  color: #ff9500;
  font-weight: 700;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-edit-detail {
  border: none;
  background: #ff9500;
  color: #ffffff;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 600;
}

.btn-edit-detail:hover {
  background: #e68600;
}

.btn-back:hover,
.btn-close:hover {
  background: #e8e8e8;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-grid div {
  background: #f8f8f8;
  border-radius: 12px;
  padding: 12px;
}

.detail-grid dt {
  font-size: 12px;
  color: #666666;
  margin-bottom: 6px;
}

.detail-grid dd {
  font-weight: 600;
}

.full-width {
  grid-column: 1 / -1;
}

.empty-state {
  text-align: center;
  color: #666666;
  padding: 24px 0;
}

@media (max-width: 640px) {
  .filter-row,
  .summary-strip,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
