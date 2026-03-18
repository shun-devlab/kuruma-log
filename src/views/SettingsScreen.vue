<script>
import { maintenanceStore, settingsStore } from '../stores/db'
import { RECORD_TYPES, getRecordMeta } from '../utils/recordMeta'

// Constants for default settings
const DEFAULT_SETTINGS = {
  car_name: '私の車',
  oil_change_km: 5000,
  oil_change_months: 6,
  fuel_alert_threshold: 25,
  tire_change_km: 50000,
  wash_interval_days: 30,
  record_order: [
    'gasoline',
    'odometer',
    'wash',
    'coating',
    'oil',
    'tire',
    'inspection',
    'repair',
    'battery',
    'insurance',
    'tax',
    'glass',
    'lamp',
    'supplies',
    'parking',
    'other'
  ]
}

export default {
  props: {
    settings: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['saved'],
  data() {
    return {
      form: {
        car_name: this.settings.car_name || '私の車',
        oil_change_km: Number(this.settings.oil_change_km) || DEFAULT_SETTINGS.oil_change_km,
        oil_change_months: Number(this.settings.oil_change_months) || DEFAULT_SETTINGS.oil_change_months,
        fuel_alert_threshold: Number(this.settings.fuel_alert_threshold) || DEFAULT_SETTINGS.fuel_alert_threshold,
        tire_change_km: Number(this.settings.tire_change_km) || DEFAULT_SETTINGS.tire_change_km,
        wash_interval_days: Number(this.settings.wash_interval_days) || DEFAULT_SETTINGS.wash_interval_days,
        record_order: Array.isArray(this.settings.record_order) && this.settings.record_order.length
          ? this.settings.record_order.filter((value) => DEFAULT_SETTINGS.record_order.includes(value))
          : [...DEFAULT_SETTINGS.record_order]
      },
      message: ''
    }
  },
  mounted() {
    // Initialize form with current settings, ensuring all default keys are present
    Object.keys(DEFAULT_SETTINGS).forEach(key => {
      // Use settings if available, otherwise use default
      if (typeof this.settings[key] === 'undefined') {
        this.form[key] = DEFAULT_SETTINGS[key];
      } else {
        this.form[key] = this.settings[key];
      }
    });

    // Ensure numeric fields are numbers, using defaults if conversion fails or value is missing from settings
    this.form.oil_change_km = Number(this.form.oil_change_km) || DEFAULT_SETTINGS.oil_change_km;
    this.form.oil_change_months = Number(this.form.oil_change_months) || DEFAULT_SETTINGS.oil_change_months;
    this.form.fuel_alert_threshold = Number(this.form.fuel_alert_threshold) || DEFAULT_SETTINGS.fuel_alert_threshold;
    this.form.tire_change_km = Number(this.form.tire_change_km) || DEFAULT_SETTINGS.tire_change_km;
    this.form.wash_interval_days = Number(this.form.wash_interval_days) || DEFAULT_SETTINGS.wash_interval_days;

    // Ensure record_order is an array and includes all defaults, with custom order preserved.
    // This also handles cases where settings.record_order might be malformed.
    if (!Array.isArray(this.form.record_order) || this.form.record_order.length === 0) {
        this.form.record_order = [...DEFAULT_SETTINGS.record_order];
    } else {
        const existingOrder = this.form.record_order;
        const updatedOrder = [
            // Keep existing order for items that are still in defaults
            ...existingOrder.filter(value => DEFAULT_SETTINGS.record_order.includes(value)),
            // Add any new default items that were not in the existing order
            ...DEFAULT_SETTINGS.record_order.filter(value => !existingOrder.includes(value))
        ];
        this.form.record_order = updatedOrder;
    }
  },
  methods: {
    async save() {
      await settingsStore.save(this.form)
      this.message = '設定を保存しました。'
      window.alert('設定を保存しました。')
      this.$emit('saved')
    },
    resetDefaults() {
      this.form = {
        ...DEFAULT_SETTINGS,
        // Ensure record_order is cloned correctly
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
.panel {
  margin-bottom: 16px;
  padding: 20px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.panel h2 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333333;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="date"],
.form-group textarea,
.form-group select {
  border: 1px solid #DDDDDD;
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #FF9500;
  box-shadow: 0 0 0 2px rgba(255, 149, 0, 0.2);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group small {
  font-size: 12px;
  color: #666666;
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
