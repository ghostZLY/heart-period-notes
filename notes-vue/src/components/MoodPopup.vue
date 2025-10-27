<template>
  <div v-if="visible" class="mood-popup-overlay" @click="close">
    <div class="mood-popup" @click.stop>
      <div class="popup-header">
        <h3>{{ formatDate(selectedDate) }}</h3>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="popup-content">
        <!-- 心情选择 -->
        <div class="mood-selection">
          <h4>今天心情如何？</h4>
          <div class="mood-options">
            <button 
              v-for="mood in moodOptions" 
              :key="mood.emoji"
              class="mood-option"
              :class="{ selected: selectedMood === mood.type }"
              @click="selectMood(mood.type)"
            >
              <span class="emoji">{{ mood.emoji }}</span>
              <span class="label">{{ mood.label }}</span>
            </button>
          </div>
        </div>
        
        <!-- 备注输入 -->
        <div class="note-input">
          <textarea 
            v-model="note" 
            placeholder="记录今天的心情或备注..." 
            rows="3"
          ></textarea>
        </div>
        
        <!-- 修改按钮区域，添加重置按钮 -->
        <div class="button-group">
          <button @click="resetForm" class="reset-btn">重置</button>
          <button @click="saveMood" class="save-btn">保存心情记录</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'MoodPopup',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    selectedDate: {
      type: Date,
      default: () => new Date()
    },
    savedMoodData:{
      type:Object,
      default:null
    }
  },
  emits: ['close', 'save-mood'],
  setup(props, { emit }) {
    const note = ref('')
    const selectedMood = ref('')

    const moodOptions = [
      { emoji: '😊', label: '开心', type: 'happy' },
      { emoji: '😢', label: '难过', type: 'sad' },
      { emoji: '😡', label: '生气', type: 'angry' },
      { emoji: '😴', label: '疲惫', type: 'tired' },
      { emoji: '😌', label: '平静', type: 'calm' },
      { emoji: '🤒', label: '不适', type: 'sick' }
    ]

    // 监听弹窗显示状态，打开时加载保存的数据
    watch(() => props.visible, (newVal) => {
      if (newVal) {
          // 弹窗打开时，加载已保存的数据
          loadSavedData()
      } else {
          // 弹窗关闭时，可以选择不清空数据，或者根据需求决定
          // resetForm() // 如果希望关闭时清空，取消注释这行
      }
    })
    // 监听日期变化，日期变化时也重新加载数据
    watch(() => props.selectedDate, () => {
      if (props.visible) {
          loadSavedData()
      }
    })
    // 加载已保存的数据
    const loadSavedData = () => {
      if (props.savedMoodData) {
          selectedMood.value = props.savedMoodData.mood || ''
          note.value = props.savedMoodData.note || ''
      } else {
          // 如果没有保存的数据，清空表单
          resetForm()
      }
    }
    // 重置表单
    const resetForm = () => {
      selectedMood.value = ''
      note.value = ''
    }

    const close = () => {
      emit('close')
    }

    const selectMood = (moodType) => {
      selectedMood.value = moodType
    }

    const saveMood = () => {
      if (selectedMood.value) {
          const moodData = {  // 先定义 moodData
              date: props.selectedDate,
              mood: selectedMood.value,
              note: note.value.trim(),
              emoji: moodOptions.find(m => m.type === selectedMood.value)?.emoji,
              timestamp: new Date().toISOString()  // 添加时间戳
          }
          console.log('准备保存心情数据:', moodData)  // 添加调试信息
          // 只 emit 一次
          emit('save-mood', moodData)
          
          // 可以选择重置表单或保持数据
          // resetForm()  // 如果需要保存后清空，取消注释
      }else {
          console.log('请选择心情')  // 调试信息
      }
    }

    const formatDate = (date) => {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    }

    return {
      note,
      selectedMood,
      moodOptions,
      close,
      selectMood,
      saveMood,
      resetForm,
      formatDate
    }
  }
}
</script>

<style scoped>
.mood-popup-overlay {
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
}

.mood-popup {
  background: white;
  border-radius: 12px;
  padding: 0;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: popup-show 0.2s ease-out;
}

@keyframes popup-show {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.popup-header h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #666;
}

.popup-content {
  padding: 20px;
}

.mood-selection {
  margin-bottom: 20px;
}

.mood-selection h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
}

.mood-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.mood-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.mood-option:hover {
  border-color: #007bff;
  transform: translateY(-1px);
}

.mood-option.selected {
  border-color: #007bff;
  background: #f0f8ff;
}

.emoji {
  font-size: 20px;
  margin-bottom: 4px;
}

.label {
  font-size: 12px;
  color: #666;
}

.mood-option.selected .label {
  color: #007bff;
  font-weight: 500;
}

.note-input {
  margin-bottom: 20px;
}

.note-input textarea {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
}

/* 新增按钮组样式 */
.button-group {
  display: flex;
  gap: 12px;
}

.save-btn {
  flex: 2;
  padding: 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.save-btn:hover {
  background: #0056b3;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.reset-btn {
  flex: 1;
  padding: 12px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.reset-btn:hover {
  background: #545b62;
}
</style>