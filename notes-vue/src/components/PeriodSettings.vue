<template>
  <div class="modal">
    <div class="modal-content">
      <span class="close" @click="$emit('close')">&times;</span>
      <h3>生理期设置</h3>
      <div class="settings-form">
        <div class="setting-item">
          <label for="period-duration">每次生理期持续天数：</label>
          <input
            type="number"
            id="period-duration"
            v-model.number="localSettings.duration"
            min="1"
            max="10"
          >
        </div>
        <div class="setting-item">
          <label for="period-interval">两次生理期间隔天数：</label>
          <input
            type="number"
            id="period-interval"
            v-model.number="localSettings.interval"
            min="20"
            max="40"
          >
        </div>
        <div class="setting-buttons">
          <button class="save-btn" @click="saveSettings">保存设置</button>
          <button class="reset-btn" @click="resetSettings">重置为默认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'PeriodSettings',
  props: {
    settings: Object
  },
  emits: ['close', 'save-settings'],
  setup(props, { emit }) {
    const localSettings = ref({ ...props.settings })

    const saveSettings = () => {
      if (localSettings.value.duration >= 1 && localSettings.value.duration <= 10 &&
          localSettings.value.interval >= 20 && localSettings.value.interval <= 40) {
        emit('save-settings', { ...localSettings.value })
      } else {
        alert('请输入有效的数值！持续天数：1-10，间隔天数：20-40')
      }
    }

    const resetSettings = () => {
      localSettings.value = { duration: 6, interval: 28 }
    }

    return {
      localSettings,
      saveSettings,
      resetSettings
    }
  }
}
</script>

<style scoped>
.settings-form {
  margin-top: 20px;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-item label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.setting-item input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.setting-item input:focus {
  border-color: #6a11cb;
  outline: none;
}

.setting-buttons {
  display: flex;
  gap: 10px;
  margin-top: 25px;
}

.save-btn, .reset-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.save-btn {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
}

.save-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.reset-btn {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e1e5e9;
}

.reset-btn:hover {
  background: #e9ecef;
}
</style>