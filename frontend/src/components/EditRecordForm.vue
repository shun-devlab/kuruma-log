<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <!-- ヘッダー -->
      <div class="modal-header">
        <h2 class="modal-title">記録を編集</h2>
        <button class="close-btn" @click="closeModal">✕</button>
      </div>

      <!-- コンテンツ -->
      <div class="modal-content">
        <div class="step-content">
          <h3 class="step-title">📝 詳細情報を編集</h3>

          <!-- メンテナンス種類（読み取り専用） -->
          <div class="form-group">
            <label class="form-label">メンテナンス種類</label>
            <div class="type-display">
              <span class="type-icon">{{ getIcon(formData.type) }}</span>
              <span class="type-name">{{ getTypeName(formData.type) }}</span>
            </div>
          </div>

          <!-- 日付 -->
          <div class="form-group">
            <label for="date" class="form-label">日付 <span class="required">*</span></label>
            <input
              id="date"
              v-model="formData.date"
              type="date"
              class="form-input"
              required
            />
          </div>

          <!-- 走行距離（オプション） -->
          <div class="form-group">
            <label for="mileage" class="form-label">走行距離（km）</label>
            <input
              id="mileage"
              v-model.number="formData.mileage"
              type="number"
              class="form-input"
              placeholder="例: 45200"
            />
          </div>

          <!-- 金額（オプション） -->
          <div class="form-group">
            <label for="amount" class="form-label">金額（円）</label>
            <input
              id="amount"
              v-model.number="formData.amount"
              type="number"
              class="form-input"
              placeholder="例: 3500"
            />
          </div>

          <!-- メモ（オプション） -->
          <div class="form-group">
            <label for="memo" class="form-label">メモ（最大500文字）</label>
            <textarea
              id="memo"
              v-model="formData.memo"
              class="form-textarea"
              placeholder="例: 高速道路走行、走行距離更新"
              maxlength="500"
            ></textarea>
            <small class="char-count">{{ formData.memo.length }} / 500</small>
          </div>

          <!-- アクション -->
          <div class="step-actions">
            <button class="btn btn-secondary" @click="closeModal">キャンセル</button>
            <button class="btn btn-primary" @click="submitForm">保存する</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import { updateMaintenanceRecord } from '../db'

export default {
  name: 'EditRecordForm',
  props: {
    isOpen: Boolean,
    record: Object
  },
  emits: ['close', 'submit'],
  setup(props, { emit }) {
    const formData = ref({
      type: '',
      date: '',
      mileage: null,
      amount: null,
      memo: ''
    })

    const isSubmitting = ref(false)

    // 記録が変更されたときにフォームを更新
    watch(
      () => props.record,
      record => {
        if (record) {
          const date = new Date(record.date)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')

          formData.value = {
            type: record.type,
            date: `${year}-${month}-${day}`,
            mileage: record.mileage || null,
            amount: record.amount || null,
            memo: record.memo || ''
          }
        }
      },
      { immediate: true }
    )

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

    const isFormValid = () => {
      return formData.value.date
    }

    // フォーム送信
    const submitForm = async () => {
      if (!isFormValid()) {
        alert('日付は必須です')
        return
      }

      isSubmitting.value = true

      try {
        await updateMaintenanceRecord(props.record.id, {
          date: new Date(formData.value.date),
          mileage: formData.value.mileage || undefined,
          amount: formData.value.amount || undefined,
          memo: formData.value.memo
        })

        console.log('[EditRecordForm] 記録を更新しました:', props.record.id)
        emit('submit', props.record)
        closeModal()
      } catch (error) {
        console.error('[EditRecordForm] 更新エラー:', error)
        alert('記録の更新に失敗しました')
      } finally {
        isSubmitting.value = false
      }
    }

    // モーダルを閉じる
    const closeModal = () => {
      emit('close')
    }

    return {
      formData,
      isSubmitting,
      getIcon,
      getTypeName,
      isFormValid,
      submitForm,
      closeModal
    }
  }
}
</script>

<style scoped>
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
  align-items: flex-end;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==================== モーダルウィンドウ ==================== */
.modal {
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  animation: modalSlideUp 0.3s ease-out;
}

@keyframes modalSlideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* ==================== モーダルヘッダー ==================== */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ecf0f1;
  position: sticky;
  top: 0;
  background: white;
  border-radius: 16px 16px 0 0;
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #95a5a6;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #ecf0f1;
  color: #2c3e50;
}

/* ==================== モーダルコンテンツ ==================== */
.modal-content {
  padding: 24px;
}

/* ==================== ステップコンテンツ ==================== */
.step-content {
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

.step-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

/* ==================== フォームグループ ==================== */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.required {
  color: #e74c3c;
}

/* 種類表示 */
.type-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.type-icon {
  font-size: 28px;
}

.type-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 15px;
}

/* フォーム入力 */
.form-input,
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

.char-count {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #95a5a6;
}

/* ==================== ステップアクション ==================== */
.step-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #ecf0f1;
  color: #2c3e50;
}

.btn-secondary:hover {
  background: #d5dbdb;
}

/* ==================== レスポンシブ ==================== */
@media (max-width: 600px) {
  .modal {
    max-height: 100vh;
    border-radius: 12px 12px 0 0;
  }

  .step-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
