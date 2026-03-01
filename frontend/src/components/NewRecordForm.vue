<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <!-- ヘッダー -->
      <div class="modal-header">
        <h2 class="modal-title">新規メンテナンス記録</h2>
        <button class="close-btn" @click="closeModal">✕</button>
      </div>

      <!-- コンテンツ -->
      <div class="modal-content">
        <!-- Step 1: メンテナンス種類選択 -->
        <div v-if="currentStep === 'type' " class="step-content">
          <h3 class="step-title">🔧 メンテナンスの種類を選択</h3>
          <div class="type-buttons">
            <button
              v-for="option in typeOptions"
              :key="option.value"
              class="type-btn"
              :class="{ active: formData.type === option.value }"
              @click="selectType(option.value)"
            >
              <span class="type-icon">{{ option.icon }}</span>
              <span class="type-label">{{ option.label }}</span>
            </button>
          </div>
          <div class="step-actions">
            <button
              class="btn btn-primary"
              :disabled="!formData.type"
              @click="currentStep = 'details'"
            >
              次へ →
            </button>
          </div>
        </div>

        <!-- Step 2: 詳細入力 -->
        <div v-else-if="currentStep === 'details'" class="step-content">
          <h3 class="step-title">📝 詳細情報を入力</h3>

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

          <!-- 種類を変更 -->
          <button class="btn-link" @click="currentStep = 'type'">
            ← 種類を変更
          </button>

          <!-- アクション -->
          <div class="step-actions">
            <button class="btn btn-secondary" @click="closeModal">キャンセル</button>
            <button
              class="btn btn-primary"
              :disabled="!isFormValid"
              @click="submitForm"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { addMaintenanceRecord } from '../db'

export default {
  name: 'NewRecordForm',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'submit'],
  setup(props, { emit }) {
    const currentStep = ref('type')
    const formData = ref({
      type: '',
      date: getTodayDate(),
      mileage: null,
      amount: null,
      memo: ''
    })
    const isSubmitting = ref(false)

    const typeOptions = [
      { value: 'gasoline', label: 'ガソリン給油', icon: '⛽' },
      { value: 'oil', label: 'オイル交換', icon: '🛢️' },
      { value: 'tire', label: 'タイヤ交換', icon: '🛞' },
      { value: 'wash', label: '洗車', icon: '🚿' },
      { value: 'repair', label: '故障・修理', icon: '⚠️' }
    ]

    // 今日の日付を YYYY-MM-DD 形式で取得
    function getTodayDate() {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      return \`\${year}-\${month}-\${day}\`
    }

    // 種類を選択
    const selectType = (type) => {
      formData.value.type = type
    }

    // フォームが有効か
    const isFormValid = computed(() => {
      return formData.value.type && formData.value.date
    })

    // フォーム送信
    const submitForm = async () => {
      if (!isFormValid.value) return

      isSubmitting.value = true
      try {
        const record = {
          type: formData.value.type,
          date: new Date(formData.value.date),
          mileage: formData.value.mileage || undefined,
          amount: formData.value.amount || undefined,
          memo: formData.value.memo || undefined
        }

        await addMaintenanceRecord(record)
        console.log('[NewRecordForm] 記録を保存しました:', record)

        // リセット
        resetForm()
        emit('submit', record)
        closeModal()
      } catch (error) {
        console.error('[NewRecordForm] 保存エラー:', error)
        alert('保存に失敗しました。もう一度お試しください。')
      } finally {
        isSubmitting.value = false
      }
    }

    // フォームをリセット
    const resetForm = () => {
      formData.value = {
        type: '',
        date: getTodayDate(),
        mileage: null,
        amount: null,
        memo: ''
      }
      currentStep.value = 'type'
    }

    // モーダルを閉じる
    const closeModal = () => {
      emit('close')
      resetForm()
    }

    return {
      currentStep,
      formData,
      isSubmitting,
      typeOptions,
      selectType,
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

/* ==================== メンテナンス種類選択ボタン ==================== */
.type-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid #ecf0f1;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #2c3e50;
}

.type-btn:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.type-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  color: #667eea;
  font-weight: 600;
}

.type-icon {
  font-size: 32px;
}

.type-label {
  font-weight: 500;
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

/* ==================== ボタンリンク ==================== */
.btn-link {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  padding: 0;
  margin-bottom: 24px;
  transition: color 0.2s;
}

.btn-link:hover {
  color: #764ba2;
  text-decoration: underline;
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

  .type-buttons {
    grid-template-columns: 1fr;
  }

  .step-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
