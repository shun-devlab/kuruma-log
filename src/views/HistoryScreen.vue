<template>
  <div class="history-screen">
    <header class="header">
      <div class="header-top">
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
            <label for="date">日付</label>
            <select id="date" v-model="selectedDate">
              <option value="all">すべて</option>
              <option v-for="date in dateOptions" :key="date" :value="date">
                {{ date }}
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

        <div v-for="group in groupedRecords" :key="group.date" class="date-group">
          <div class="date-group-header">
            <strong>{{ formatDate(group.date) }}</strong>
            <span>{{ group.records.length }}件</span>
          </div>

          <article
            v-for="record in group.records"
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
        </div>
      </section>

      <section v-if="selectedRecord" class="detail-panel">
        <div class="detail-header">
          <div>
            <h2>詳細</h2>
            <p>{{ getLabel(selectedRecord.type) }}</p>
          </div>
          <div class="detail-actions">
            <button class="btn-edit-detail" @click="$emit('edit-record', selectedRecord)">編集する</button>
            <button class="btn-delete-detail" @click="requestDelete(selectedRecord)">削除する</button>
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
import { RECORD_TYPES, getRecordMeta } from '../utils/recordMeta'

export default {
  props: {
    records: {
      type: Array,
      default: () => []
    }
  },
  emits: ['back', 'edit-record', 'delete-record'],
  data() {
    return {
      searchQuery: '',
      selectedType: 'all',
      selectedMonth: 'all',
      selectedDate: 'all',
      sortOrder: 'desc',
      selectedRecord: null
    }
  },
  computed: {
    typeOptions() {
      return RECORD_TYPES.map((item) => ({ value: item.value, label: item.fullLabel }))
    },
    monthOptions() {
      return [...new Set(this.records.map((record) => `${record.date.slice(0, 7)}`))].sort().reverse()
    },
    dateOptions() {
      return [...new Set(this.records.map((record) => record.date))].sort().reverse()
    },
    filteredRecords() {
      const query = this.searchQuery.toLowerCase()
      const filtered = this.records.filter((record) => {
        const matchesType = this.selectedType === 'all' || record.type === this.selectedType
        const matchesMonth = this.selectedMonth === 'all' || record.date.startsWith(this.selectedMonth)
        const matchesDate = this.selectedDate === 'all' || record.date === this.selectedDate
        const searchable = [
          this.getLabel(record.type),
          record.type,
          record.date,
          record.memo || ''
        ].join(' ').toLowerCase()
        const matchesQuery = !query || searchable.includes(query)
        return matchesType && matchesMonth && matchesDate && matchesQuery
      })

      return filtered.sort((a, b) => {
        const left = new Date(`${a.date}T00:00:00`).getTime()
        const right = new Date(`${b.date}T00:00:00`).getTime()
        return this.sortOrder === 'desc' ? right - left : left - right
      })
    },
    filteredExpense() {
      return this.filteredRecords.reduce((sum, record) => sum + (Number(record.amount) || 0), 0)
    },
    groupedRecords() {
      const groups = new Map()
      this.filteredRecords.forEach((record) => {
        if (!groups.has(record.date)) groups.set(record.date, [])
        groups.get(record.date).push(record)
      })
      return Array.from(groups.entries()).map(([date, records]) => ({ date, records }))
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
      return getRecordMeta(type).icon
    },
    getLabel(type) {
      return getRecordMeta(type).fullLabel
    },
    formatDate(dateString) {
      const date = new Date(`${dateString}T00:00:00`)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },
    formatCurrency(value) {
      return `¥${Math.round(Number(value) || 0).toLocaleString('ja-JP')}`
    },
    requestDelete(record) {
      if (!record) return
      const confirmed = window.confirm(`${this.getLabel(record.type)}の記録を削除します。よろしいですか？`)
      if (!confirmed) return
      this.$emit('delete-record', record)
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.date-group + .date-group {
  margin-top: 16px;
}

.date-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  color: #666666;
  font-size: 13px;
}

.date-group-header strong {
  color: #333333;
  font-size: 14px;
}

.date-group-header span {
  background: #f2f2f2;
  border-radius: 999px;
  padding: 4px 8px;
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

.btn-delete-detail {
  border: 1px solid #f5c2c0;
  background: #fdecec;
  color: #e74c3c;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 600;
}

.btn-edit-detail:hover {
  background: #e68600;
}

.btn-delete-detail:hover {
  background: #fadbd8;
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

@media (max-width: 768px) {
  .header {
    padding: 12px;
  }

  .content {
    padding: 12px;
    gap: 12px;
  }

  .filter-panel,
  .list-panel,
  .detail-panel,
  .summary-strip {
    padding: 14px;
  }

  .record-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}

@media (max-width: 640px) {
  .filter-row,
  .summary-strip,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .detail-actions {
    width: 100%;
  }

  .detail-actions button {
    flex: 1;
  }
}
</style>
