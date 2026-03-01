<template>
  <div class="record-list-screen">
    <!-- ヘッダー -->
    <header class="header">
      <h1 class="title">📋 メンテナンス記録</h1>
    </header>

    <!-- メインコンテンツ -->
    <main class="main-content">
      <!-- フィルタ・ソートセクション -->
      <section class="controls-section">
        <!-- 種類フィルタ（タブ） -->
        <div class="filter-tabs">
          <button
            v-for="type in typeOptions"
            :key="type.value"
            class="filter-tab"
            :class="{ active: selectedType === type.value }"
            @click="selectedType = type.value"
          >
            <span class="filter-icon">{{ type.icon }}</span>
            <span class="filter-label">{{ type.label }}</span>
          </button>
        </div>

        <!-- 日付範囲フィルタ & ソート -->
        <div class="filter-controls">
          <div class="filter-group">
            <label for="month-select" class="filter-label-text">月選択</label>
            <input
              id="month-select"
              v-model="selectedMonth"
              type="month"
              class="filter-input"
            />
          </div>

          <div class="filter-group">
            <label for="sort-select" class="filter-label-text">ソート</label>
            <select v-model="sortBy" class="filter-input">
              <option value="date-desc">日付（新順）</option>
              <option value="date-asc">日付（旧順）</option>
              <option value="amount-desc">金額（多順）</option>
              <option value="amount-asc">金額（少順）</option>
            </select>
          </div>
        </div>
      </section>

      <!-- 結果サマリー -->
      <div class="summary">
        <p class="summary-text">{{ filteredRecords.length }} 件の記録</p>
      </div>

      <!-- 記録リスト -->
      <div class="record-list">
        <div
          v-for="record in filteredRecords"
          :key="record.id"
          class="record-card"
          @mouseenter="hoveredId = record.id"
          @mouseleave="hoveredId = null"
          @contextmenu.prevent="showActions(record.id)"
        >
          <!-- スワイプハンドラ（モバイル） -->
          <div
            class="record-card-content"
            @touchstart="touchStart($event, record.id)"
            @touchmove="touchMove"
            @touchend="touchEnd($event, record.id)"
          >
            <!-- レコード情報 -->
            <div class="record-info">
              <div class="record-type">
                <span class="type-icon">{{ getIcon(record.type) }}</span>
                <span class="type-name">{{ getTypeName(record.type) }}</span>
              </div>
              <div class="record-details">
                <p class="record-date">📅 {{ formatDate(record.date) }}</p>
                <p v-if="record.mileage" class="record-mileage">
                  🔧 {{ record.mileage }}km
                </p>
                <p v-if="record.amount" class="record-amount">
                  💰 ¥{{ formatAmount(record.amount) }}
                </p>
              </div>
            </div>

            <!-- メモ表示 -->
            <p v-if="record.memo" class="record-memo">{{ record.memo }}</p>

            <!-- 操作ボタン（ホバー時またはスワイプ時） -->
            <div
              class="record-actions"
              :class="{
                visible:
                  hoveredId === record.id ||
                  swipedId === record.id ||
                  showActionId === record.id
              }"
            >
              <button class="action-btn edit-btn" @click="openEditForm(record)">
                ✏️ 編集
              </button>
              <button class="action-btn delete-btn" @click="openDeleteConfirm(record)">
                🗑️ 削除
              </button>
            </div>
          </div>
        </div>

        <!-- 記録がない場合 -->
        <div v-if="filteredRecords.length === 0" class="empty-state">
          <p class="empty-icon">📝</p>
          <p class="empty-text">該当する記録がありません</p>
        </div>
      </div>
    </main>

    <!-- 編集フォーム（モーダル） -->
    <EditRecordForm
      :isOpen="isEditFormOpen"
      :record="editingRecord"
      @close="closeEditForm"
      @submit="onRecordUpdate"
    />

    <!-- 削除確認ダイアログ -->
    <div v-if="isDeleteConfirmOpen" class="modal-overlay" @click="closeDeleteConfirm">
      <div class="confirm-modal" @click.stop>
        <h2 class="confirm-title">記録を削除しますか？</h2>
        <p class="confirm-message">
          この操作は元に戻せません。本当に削除してもよろしいですか？
        </p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" @click="closeDeleteConfirm">
            キャンセル
          </button>
          <button class="btn btn-danger" @click="deleteRecord">
            削除する
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { getAllMaintenanceRecords } from '../db'
import EditRecordForm from './EditRecordForm.vue'

export default {
  name: 'RecordListScreen',
  components: {
    EditRecordForm
  },
  setup() {
    const records = ref([])
    const selectedType = ref('all')
    const selectedMonth = ref(new Date().toISOString().slice(0, 7))
    const sortBy = ref('date-desc')
    const hoveredId = ref(null)
    const swipedId = ref(null)
    const showActionId = ref(null)

    const isEditFormOpen = ref(false)
    const editingRecord = ref(null)
    const isDeleteConfirmOpen = ref(false)
    const deletingRecordId = ref(null)

    const touchStartX = ref(0)
    const touchEndX = ref(0)

    const typeOptions = [
      { value: 'all', label: 'すべて', icon: '📋' },
      { value: 'gasoline', label: 'ガソリン', icon: '⛽' },
      { value: 'oil', label: 'オイル', icon: '🛢️' },
      { value: 'tire', label: 'タイヤ', icon: '🛞' },
      { value: 'wash', label: '洗車', icon: '🚿' },
      { value: 'repair', label: '修理', icon: '⚠️' }
    ]

    // フィルタリング・ソート
    const filteredRecords = computed(() => {
      let filtered = records.value

      // 種類フィルタ
      if (selectedType.value !== 'all') {
        filtered = filtered.filter(r => r.type === selectedType.value)
      }

      // 月フィルタ
      if (selectedMonth.value) {
        const [year, month] = selectedMonth.value.split('-').map(Number)
        filtered = filtered.filter(r => {
          const d = new Date(r.date)
          return d.getFullYear() === year && d.getMonth() + 1 === month
        })
      }

      // ソート
      filtered.sort((a, b) => {
        switch (sortBy.value) {
          case 'date-asc':
            return new Date(a.date) - new Date(b.date)
          case 'date-desc':
            return new Date(b.date) - new Date(a.date)
          case 'amount-asc':
            return (a.amount || 0) - (b.amount || 0)
          case 'amount-desc':
            return (b.amount || 0) - (a.amount || 0)
          default:
            return 0
        }
      })

      return filtered
    })

    // 日付フォーマット
    const formatDate = date => {
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    // 金額フォーマット
    const formatAmount = amount => amount.toLocaleString()

    // アイコン取得
    const getIcon = type => {
      const icons = {
        gasoline: '⛽',
        oil: '🛢️',
        tire: '🛞',
        wash: '🚿',
        repair: '⚠️'
      }
      return icons[type] || '📝'
    }

    // タイプ名取得
    const getTypeName = type => {
      const names = {
        gasoline: 'ガソリン給油',
        oil: 'オイル交換',
        tire: 'タイヤ交換',
        wash: '洗車',
        repair: '故障・修理'
      }
      return names[type] || type
    }

    // スワイプ処理
    const touchStart = (e, recordId) => {
      touchStartX.value = e.touches[0].clientX
    }

    const touchMove = e => {
      touchEndX.value = e.touches[0].clientX
    }

    const touchEnd = (e, recordId) => {
      const distance = touchStartX.value - touchEndX.value
      if (distance > 50) {
        // 左スワイプ（アクション表示）
        swipedId.value = recordId
      } else if (distance < -50) {
        // 右スワイプ（アクション非表示）
        swipedId.value = null
      }
    }

    // 右クリック処理
    const showActions = recordId => {
      showActionId.value = recordId
    }

    // 編集フォームを開く
    const openEditForm = record => {
      editingRecord.value = record
      isEditFormOpen.value = true
      swipedId.value = null
      showActionId.value = null
    }

    // 編集フォームを閉じる
    const closeEditForm = () => {
      isEditFormOpen.value = false
      editingRecord.value = null
    }

    // 記録が更新されたときの処理
    const onRecordUpdate = async record => {
      console.log('[RecordListScreen] 記録が更新されました:', record)
      records.value = await getAllMaintenanceRecords()
    }

    // 削除確認を開く
    const openDeleteConfirm = record => {
      deletingRecordId.value = record.id
      isDeleteConfirmOpen.value = true
      swipedId.value = null
      showActionId.value = null
    }

    // 削除確認を閉じる
    const closeDeleteConfirm = () => {
      isDeleteConfirmOpen.value = false
      deletingRecordId.value = null
    }

    // 記録を削除
    const deleteRecord = async () => {
      if (deletingRecordId.value) {
        try {
          const { deleteMaintenanceRecord } = await import('../db')
          await deleteMaintenanceRecord(deletingRecordId.value)
          console.log('[RecordListScreen] 記録を削除しました')
          records.value = await getAllMaintenanceRecords()
          closeDeleteConfirm()
        } catch (error) {
          console.error('[RecordListScreen] 削除エラー:', error)
        }
      }
    }

    // マウント時：データ読み込み
    onMounted(async () => {
      records.value = await getAllMaintenanceRecords()
    })

    return {
      records,
      selectedType,
      selectedMonth,
      sortBy,
      hoveredId,
      swipedId,
      showActionId,
      isEditFormOpen,
      editingRecord,
      isDeleteConfirmOpen,
      typeOptions,
      filteredRecords,
      formatDate,
      formatAmount,
      getIcon,
      getTypeName,
      touchStart,
      touchMove,
      touchEnd,
      showActions,
      openEditForm,
      closeEditForm,
      onRecordUpdate,
      openDeleteConfirm,
      closeDeleteConfirm,
      deleteRecord
    }
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.record-list-screen {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* ==================== ヘッダー ==================== */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 1px;
}

/* ==================== メインコンテンツ ==================== */
.main-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

/* ==================== コントロールセクション ==================== */
.controls-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* フィルタタブ */
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.filter-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  color: #7f8c8d;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-tab:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.filter-tab.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  color: #667eea;
  font-weight: 600;
}

.filter-icon {
  font-size: 18px;
}

.filter-label {
  font-size: 11px;
}

/* フィルタコントロール */
.filter-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group {
  flex: 1;
  min-width: 150px;
}

.filter-label-text {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #2c3e50;
}

.filter-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.filter-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

/* ==================== サマリー ==================== */
.summary {
  padding: 0 16px 12px;
}

.summary-text {
  margin: 0;
  font-size: 13px;
  color: #7f8c8d;
  font-weight: 500;
}

/* ==================== レコードリスト ==================== */
.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
  position: relative;
}

.record-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.record-card-content {
  padding: 16px;
  position: relative;
  transition: transform 0.2s;
}

.record-card-content.swiped {
  transform: translateX(-80px);
}

/* レコード情報 */
.record-info {
  margin-bottom: 8px;
}

.record-type {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.type-icon {
  font-size: 24px;
}

.type-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 15px;
}

.record-details {
  padding-left: 32px;
}

.record-date,
.record-mileage,
.record-amount {
  margin: 6px 0;
  font-size: 13px;
  color: #34495e;
}

.record-amount {
  color: #e74c3c;
  font-weight: 600;
}

.record-memo {
  margin: 12px 0 0 32px;
  padding: 8px;
  background: #f8f9fa;
  border-left: 3px solid #667eea;
  font-size: 12px;
  color: #555;
  border-radius: 4px;
}

/* 操作ボタン */
.record-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ecf0f1;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.2s;
}

.record-actions.visible {
  opacity: 1;
  max-height: 40px;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn {
  background: #667eea;
  color: white;
}

.edit-btn:hover {
  background: #764ba2;
  transform: translateY(-1px);
}

.delete-btn {
  background: #ecf0f1;
  color: #e74c3c;
}

.delete-btn:hover {
  background: #d5dbdb;
  transform: translateY(-1px);
}

/* ==================== 空状態 ==================== */
.empty-state {
  text-align: center;
  padding: 60px 16px;
}

.empty-icon {
  font-size: 48px;
  margin: 0 0 16px;
}

.empty-text {
  margin: 0;
  font-size: 14px;
  color: #95a5a6;
  font-weight: 500;
}

/* ==================== モーダルオーバーレイ ==================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 削除確認ダイアログ */
.confirm-modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.confirm-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.confirm-message {
  margin: 0 0 20px;
  font-size: 14px;
  color: #7f8c8d;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #ecf0f1;
  color: #2c3e50;
}

.btn-secondary:hover {
  background: #d5dbdb;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

/* ==================== レスポンシブ ==================== */
@media (max-width: 600px) {
  .title {
    font-size: 24px;
  }

  .filter-controls {
    flex-direction: column;
  }

  .filter-group {
    min-width: auto;
  }

  .main-content {
    padding: 12px;
  }
}
</style>
