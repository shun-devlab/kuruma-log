<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ panelTitle }}</h3>
        <button @click="$emit('close')" class="btn-close">✕</button>
      </div>

      <form @submit.prevent="submit" class="form">
        <!-- 日付 -->
        <div class="form-group">
          <label>日付 *</label>
          <input v-model="form.date" type="date" required>
        </div>

        <!-- 走行距離（ガソリン / 総走行距離更新のみ必須） -->
        <div v-if="['gasoline', 'odometer'].includes(recordType)" class="form-group">
          <label>{{ recordType === 'gasoline' ? '走行距離 *' : '総走行距離 *' }}</label>
          <input v-model.number="form.mileage" type="number" placeholder="km" required>
        </div>


        <!-- 金額（オプション） -->
        <div class="form-group">
          <label>金額（オプション）</label>
          <input v-model.number="form.amount" type="number" placeholder="¥">
        </div>

        <!-- メモ（オプション） -->
        <div class="form-group">
          <label>メモ（オプション）</label>
          <textarea v-model="form.memo" placeholder="最大 500 文字" maxlength="500"></textarea>
        </div>

        <!-- ボタン -->
        <div class="form-actions">
          <button v-if="initialRecord" type="button" @click="requestDelete" class="btn-danger">削除</button>
          <button type="submit" class="btn-primary">{{ initialRecord ? '更新' : '保存' }}</button>
          <button type="button" @click="$emit('close')" class="btn-secondary">キャンセル</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { getRecordMeta } from '../utils/recordMeta'

export default {
  props: {
    recordType: {
      type: String,
      required: true
    },
    settings: {
      type: Object,
      required: true
    },
    suggestedMileage: {
      type: Number,
      required: true
    },
    initialRecord: {
      type: Object,
      default: null
    }
  },
  emits: ['save', 'delete', 'close'],
  data() {
    return {
      form: {
        type: this.recordType,
        date: this.getTodayDate(),
        mileage: this.suggestedMileage,
        amount: null,
        memo: ''
      }
    }
  },
  computed: {
    panelTitle() {
      return this.initialRecord ? `${this.getLabel(this.recordType)}を編集` : this.getLabel(this.recordType)
    }
  },
  mounted() {
    if (this.initialRecord) {
      this.form = {
        type: this.initialRecord.type,
        date: this.initialRecord.date || this.getTodayDate(),
        mileage: this.initialRecord.mileage ?? this.suggestedMileage,
        amount: this.initialRecord.amount ?? null,
        memo: this.initialRecord.memo ?? ''
      }
    }
  },
  methods: {
    submit() {
      this.$emit('save', { ...this.form, type: this.recordType })
    },
    requestDelete() {
      const confirmed = window.confirm(`${this.getLabel(this.recordType)}の記録を削除します。よろしいですか？`)
      if (!confirmed) return
      this.$emit('delete')
    },
    getTodayDate() {
      const date = new Date()
      return date.toISOString().split('T')[0]
    },
    getLabel(type) {
      const meta = getRecordMeta(type)
      return `${meta.icon} ${meta.fullLabel}`
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 100;
}

.modal-content {
  background: #FFFFFF;
  width: 100%;
  max-width: 480px;
  border-radius: 16px 16px 0 0;
  padding: 24px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: bold;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333333;
}

.form-group input,
.form-group textarea {
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  padding: 12px;
  font-size: 14px;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4A90E2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group small {
  font-size: 12px;
  color: #666666;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  flex: 1;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #FF9500;
  color: #FFFFFF;
}

.btn-primary:hover {
  background: #E68A00;
}

.btn-secondary {
  background: #F5F5F5;
  color: #333333;
}

.btn-secondary:hover {
  background: #EEEEEE;
}

.btn-danger {
  background: #FDECEC;
  color: #E74C3C;
}

.btn-danger:hover {
  background: #FADBD8;
}

@media (max-width: 480px) {
  .form-actions {
    flex-direction: column;
  }
}
</style>
