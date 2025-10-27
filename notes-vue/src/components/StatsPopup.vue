<template>
  <div v-if="visible" class="stats-popup-overlay" @click="close">
    <div class="stats-popup" @click.stop>
      <div class="popup-header">
        <h3>{{ formatDateTitle(selectedDate) }}</h3>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="popup-content">
        <!-- 月份选择器 -->
        <div class="month-selector">
          <button @click="prevMonth" class="nav-btn">‹</button>
          <span class="current-month">{{ currentYear }}年{{ currentMonth }}月</span>
          <button @click="nextMonth" class="nav-btn">›</button>
        </div>
        
        <!-- 心情统计 -->
        <div class="stats-content">
          <h4>心情统计</h4>
          <div class="mood-stats">
            <div 
              v-for="stat in moodStats" 
              :key="stat.type"
              class="stat-item"
            >
              <div class="stat-info">
                <span class="stat-emoji">{{ stat.emoji }}</span>
                <span class="stat-label">{{ stat.label }}</span>
                <span class="stat-count">{{ stat.count }}次</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: stat.percentage + '%' }"
                  :class="stat.type"
                ></div>
              </div>
              <span class="stat-percentage">{{ stat.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'StatsPopup',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    selectedDate: {
      type: Date,
      default: () => new Date()
    },
    moodData: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const currentYear = ref(new Date().getFullYear())
    const currentMonth = ref(new Date().getMonth() + 1)

    const moodOptions = [
      { emoji: '😊', label: '开心', type: 'happy' },
      { emoji: '😢', label: '难过', type: 'sad' },
      { emoji: '😡', label: '生气', type: 'angry' },
      { emoji: '😴', label: '疲惫', type: 'tired' },
      { emoji: '😌', label: '平静', type: 'calm' },
      { emoji: '🤒', label: '不适', type: 'sick' }
    ]

    // 计算心情统计
    const moodStats = computed(() => {
      // 过滤出当前年月的数据
      const monthData = props.moodData.filter(item => {
        const itemDate = new Date(item.date)
        return itemDate.getFullYear() === currentYear.value && 
               itemDate.getMonth() + 1 === currentMonth.value
      })

      // 统计每种心情的数量
      const stats = moodOptions.map(mood => {
        const count = monthData.filter(item => item.mood === mood.type).length
        return {
          ...mood,
          count,
          percentage: monthData.length > 0 ? Math.round((count / monthData.length) * 100) : 0
        }
      })

      // 按数量降序排序
      return stats.sort((a, b) => b.count - a.count)
    })

    const close = () => {
      emit('close')
    }

    const prevMonth = () => {
      if (currentMonth.value === 1) {
        currentMonth.value = 12
        currentYear.value--
      } else {
        currentMonth.value--
      }
    }

    const nextMonth = () => {
      if (currentMonth.value === 12) {
        currentMonth.value = 1
        currentYear.value++
      } else {
        currentMonth.value++
      }
    }

    const formatDateTitle = (date) => {
      return '心情统计'
    }

    // 监听弹窗打开，重置为当前月份
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        const now = new Date()
        currentYear.value = now.getFullYear()
        currentMonth.value = now.getMonth() + 1
      }
    })

    return {
      currentYear,
      currentMonth,
      moodStats,
      close,
      prevMonth,
      nextMonth,
      formatDateTitle
    }
  }
}
</script>

<style scoped>
.stats-popup-overlay {
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

.stats-popup {
  background: white;
  border-radius: 12px;
  padding: 0;
  width: 90%;
  max-width: 450px;
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

.month-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.nav-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
}

.nav-btn:hover {
  background: #e9ecef;
}

.current-month {
  font-weight: 600;
  color: #333;
}

.stats-content h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
}

.mood-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.stat-emoji {
  font-size: 20px;
}

.stat-label {
  font-size: 14px;
  color: #333;
  min-width: 40px;
}

.stat-count {
  font-size: 12px;
  color: #666;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* 不同心情的颜色 */
.progress-fill.happy { background: #f9f871; }
.progress-fill.sad { background: #fb88d6; }
.progress-fill.angry { background: #ff8fae; }
.progress-fill.tired { background: #ffab85; }
.progress-fill.calm { background: #b28dee; }
.progress-fill.sick { background: #ffd16a; }

.stat-percentage {
  font-size: 12px;
  color: #666;
  min-width: 40px;
  text-align: right;
}
</style>