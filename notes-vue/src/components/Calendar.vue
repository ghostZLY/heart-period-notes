<template>
  <div class="calendar-main">
    <div class="calendar-container">
      <div class="calendar-header">
        <button class="nav-btn" @click="prevMonth">&#10094;</button>
        <div class="month-year">{{ displayMonthYear }}</div>
        <button class="nav-btn" @click="nextMonth">&#10095;</button>
        <!-- 添加统计按钮 -->
        <button class="nav-btn stats-btn" @click="$emit('open-stats')">❤</button>
        <button class="nav-btn settings-btn" @click="$emit('open-settings')">🌙</button>
      </div>
      
      <div class="weekdays">
        <div v-for="day in weekdays" :key="day">{{ day }}</div>
      </div>
      
      <div class="days">
        <div
          v-for="day in calendarDays"
          :key="day.dateStr"
          class="day"
          :class="getDayClasses(day)"
          @click="selectDate(day)"
          @contextmenu.prevent="openPeriodModal(day)" 
        >
          <div class="day-number">{{ day.number }}</div>
          <!-- 心情按钮/图标 -->
          <div 
            class="mood-indicator"
            :class="{ 'has-mood': getMoodForDate(day.date) }"
            @click.stop="openMoodPopup(day)"
          >
            {{ getMoodEmoji(day.date) || '' }}
          </div>
          <!-- 血量和痛度标记显示 -->
          <div v-if="dayRatings && dayRatings[day.dateStr]" class="rating-indicators">
            <!-- 血量标记 -->
            <div v-if="dayRatings[day.dateStr].bloodLevel > 0" class="blood-indicator">
              <div 
                v-for="level in 3" 
                :key="'blood-indicator-' + level"
                class="indicator-rect"
                :class="{ active: dayRatings[day.dateStr].bloodLevel >= level }"
              ></div>
            </div>
            <!-- 痛度标记 -->
            <div v-if="dayRatings[day.dateStr].painLevel > 0" class="pain-indicator">
              <div 
                v-for="level in 3" 
                :key="'pain-indicator-' + level"
                class="indicator-rect"
                :class="{ active: dayRatings[day.dateStr].painLevel >= level }"
              ></div>
            </div>
          </div>
          <!-- 添加点击标记的提示 -->
          <div v-if="!day.isOtherMonth" class="day-hint"></div>
        </div>
      </div>
      
      <div class="current-date">{{ currentDateDisplay }}</div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'Calendar',
  props: {
    currentDate: Date,
    selectedDate: Date,
    periodDates: Array,
    periodSettings: Object,
    moodRecords: Object,
    dayRatings: Object
  },
  emits: ['date-select', 'month-change', 'period-mark', 'open-settings','mood-click','open-stats'],
  setup(props, { emit }) {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]

    // 显示的年月
    const displayMonthYear = computed(() => {
      return `${props.currentDate.getFullYear()}年${monthNames[props.currentDate.getMonth()]}`
    })

    // 当前日期显示
    const currentDateDisplay = computed(() => {
      return props.currentDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    })

    // 生成日历天数
    const calendarDays = computed(() => {
      const year = props.currentDate.getFullYear()
      const month = props.currentDate.getMonth()
      
      // 当月第一天
      const firstDay = new Date(year, month, 1)
      // 当月最后一天
      const lastDay = new Date(year, month + 1, 0)
      // 当月天数
      const daysInMonth = lastDay.getDate()
      // 第一天是周几
      const firstDayIndex = firstDay.getDay()
      
      const days = []
      
      // 添加上个月的最后几天
      const prevMonthLastDay = new Date(year, month, 0).getDate()
      for (let i = firstDayIndex; i > 0; i--) {
        const dayNumber = prevMonthLastDay - i + 1
        const dayMonth = month - 1 < 0 ? 11 : month - 1
        const dayYear = month - 1 < 0 ? year - 1 : year
        days.push({
          number: dayNumber,
          year: dayYear,
          month: dayMonth,
          date: new Date(dayYear, dayMonth, dayNumber),
          dateStr: formatDate(dayYear, dayMonth, dayNumber),
          isOtherMonth: true
        })
      }
      
      // 添加当月日期
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({
          number: i,
          year: year,
          month: month,
          date: new Date(year, month, i),
          dateStr: formatDate(year, month, i),
          isOtherMonth: false
        })
      }
      
      // 添加下个月的前几天
      const totalCells = 42
      const nextDays = totalCells - (firstDayIndex + daysInMonth)
      for (let i = 1; i <= nextDays; i++) {
        const dayMonth = month + 1 > 11 ? 0 : month + 1
        const dayYear = month + 1 > 11 ? year + 1 : year
        days.push({
          number: i,
          year: dayYear,
          month: dayMonth,
          date: new Date(dayYear, dayMonth, i),
          dateStr: formatDate(dayYear, dayMonth, i),
          isOtherMonth: true
        })
      }
      
      return days
    })

    // 获取预测的生理期日期
    const predictedDates = computed(() => {
      if (props.periodDates.length === 0) return []
      
      // 获取用于预测的起始日期
      const predictionStartDate = getPredictionStartDate()
      if (!predictionStartDate) return []
      
      //计算下一次预测
      const nextPredictedStart = new Date(predictionStartDate)
      nextPredictedStart.setDate(predictionStartDate.getDate() + props.periodSettings.interval)
      
      return getPredictedPeriodDates(nextPredictedStart)
    })

    // 获取预测的排卵期日期
    const ovulationDates = computed(() => {
      if (props.periodDates.length === 0) return { ovulationDay: null, ovulationPeriod: [] }
      
      // 获取用于预测的起始日期
      const predictionStartDate = getPredictionStartDate()
      if (!predictionStartDate) return { ovulationDay: null, ovulationPeriod: [] }
      
      // 计算下一次预测的生理期开始日期
      const nextPredictedStart = new Date(predictionStartDate)
      nextPredictedStart.setDate(predictionStartDate.getDate() + props.periodSettings.interval)
      
      return getPredictedOvulationDates(nextPredictedStart)
    })
    // 获取日期样式类
    const getDayClasses = (day) => {
      const classes = []
      
      if (day.isOtherMonth) {
        classes.push('other-month')
      }
      
      if (isToday(day.date)) {
        classes.push('today')
      }
      
      if (isSelected(day.date)) {
        classes.push('selected')
      }
      
      if (props.periodDates.includes(day.dateStr)) {
        classes.push('period-marked')
      }
      // 预测生理期（淡红色）
      if (predictedDates.value.includes(day.dateStr) && !props.periodDates.includes(day.dateStr)) {
        classes.push('period-predicted')
      }

      // 排卵日（深紫色）
      if (ovulationDates.value.ovulationDay === day.dateStr && !props.periodDates.includes(day.dateStr)) {
        classes.push('ovulation-day')
      }
      
      // 排卵期（淡紫色）
      if (ovulationDates.value.ovulationPeriod.includes(day.dateStr) && 
          ovulationDates.value.ovulationDay !== day.dateStr && 
          !props.periodDates.includes(day.dateStr)) {
        classes.push('ovulation-period')
      }
      
      return classes
    }

    // 选择日期
    const selectDate = (day) => {
      if (!day.isOtherMonth) {
        emit('date-select', day.date)
      }
    }
    // 打开生理期标记弹窗
    const openPeriodModal = (day) => {
      if (!day.isOtherMonth) {
        // 先选择这个日期
        emit('date-select', day.date)
        // 然后触发生理期标记
        emit('period-mark')
      }
    }

    // 上个月
    const prevMonth = () => {
      const newDate = new Date(props.currentDate)
      newDate.setMonth(newDate.getMonth() - 1)
      emit('month-change', newDate)
    }

    // 下个月
    const nextMonth = () => {
      const newDate = new Date(props.currentDate)
      newDate.setMonth(newDate.getMonth() + 1)
      emit('month-change', newDate)
    }

    // 判断是否是今天
    const isToday = (date) => {
      const today = new Date()
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear()
    }

    // 判断是否被选中
    const isSelected = (date) => {
      return props.selectedDate &&
             date.getDate() === props.selectedDate.getDate() &&
             date.getMonth() === props.selectedDate.getMonth() &&
             date.getFullYear() === props.selectedDate.getFullYear()
    }
    // 获取用于预测的起始日期
    const getPredictionStartDate = () => {
      if (props.periodDates.length === 0) return null
      
      // 将所有标记日期转换为Date对象并排序（从早到晚）
      const sortedDates = props.periodDates
        .map(dateStr => parseDate(dateStr))
        .sort((a, b) => a - b)
      
      // 情况1：有完整周期时，使用最近周期的第一天
      const latestCycle = getLatestPeriodCycle(sortedDates)
      if (latestCycle) {
        return latestCycle.startDate
      }
      
      // 情况2：没有完整周期时，使用最近的标记日期作为起始点
      // 但需要检查这个日期是否可能是某个周期的开始
      const potentialStartDates = findPotentialStartDates(sortedDates)
      if (potentialStartDates.length > 0) {
        // 返回最晚的潜在开始日期
        return potentialStartDates[potentialStartDates.length - 1]
      }
      
      // 情况3：只有单个日期时，直接使用这个日期
      return sortedDates[sortedDates.length - 1]
      }

    // 获取最近的完整生理周期
    const getLatestPeriodCycle = (sortedDates) => {
      const cycles = []
      let currentCycle = []
      
      for (let i = 0; i < sortedDates.length; i++) {
        const currentDate = sortedDates[i]
        
        if (currentCycle.length === 0) {
          // 开始新的周期
          currentCycle.push(currentDate)
        } else {
          const lastDate = currentCycle[currentCycle.length - 1]
          const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24))
          
          if (daysDiff === 1) {
            // 连续日期，属于同一个周期
            currentCycle.push(currentDate)
          } else {
            // 日期不连续，保存当前周期并开始新周期
            if (currentCycle.length >= 2) { // 至少2天算一个有效周期
              cycles.push({
                startDate: currentCycle[0],
                endDate: currentCycle[currentCycle.length - 1],
                dates: [...currentCycle]
              })
            }
            currentCycle = [currentDate]
          }
        }
      }
      
      // 保存最后一个周期
      if (currentCycle.length >= 2) {
        cycles.push({
          startDate: currentCycle[0],
          endDate: currentCycle[currentCycle.length - 1],
          dates: [...currentCycle]
        })
      }
      
      // 返回最近的周期（按开始日期排序，取最后一个）
      if (cycles.length > 0) {
        const sortedCycles = cycles.sort((a, b) => b.startDate - a.startDate)
        return sortedCycles[0]
      }
      
      return null
    }
    // 找出潜在的周期开始日期
    const findPotentialStartDates = (sortedDates) => {
      const potentialStarts = []
      
      for (let i = 0; i < sortedDates.length; i++) {
        const currentDate = sortedDates[i]
        let isStartDate = true
        
        // 检查这个日期前面是否有连续的日期
        if (i > 0) {
          const prevDate = sortedDates[i - 1]
          const daysDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24))
          if (daysDiff === 1) {
            // 如果与前一个日期连续，说明这不是开始日期
            isStartDate = false
          }
        }
        
        if (isStartDate) {
          potentialStarts.push(currentDate)
        }
      }
      
      return potentialStarts
    }

    // 获取预测的生理期日期范围
    const getPredictedPeriodDates = (startDate) => {
      const predictedDates = []
      const start = new Date(startDate)
      
      for (let i = 0; i < props.periodSettings.duration; i++) {
        const currentDate = new Date(start)
        currentDate.setDate(start.getDate() + i)
        predictedDates.push(formatDate(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate()
        ))
      }
      
      return predictedDates
    }
    // 获取预测的排卵期日期
    const getPredictedOvulationDates = (periodStartDate) => {
      const ovulationDates = {
        ovulationDay: null,
        ovulationPeriod: []
      }
      
      // 计算排卵日：下次月经来潮前14天
      const ovulationDay = new Date(periodStartDate)
      ovulationDay.setDate(periodStartDate.getDate() - 14)
      
      ovulationDates.ovulationDay = formatDate(
        ovulationDay.getFullYear(),
        ovulationDay.getMonth(),
        ovulationDay.getDate()
      )
      
      // 计算排卵期：排卵日前5天和后4天，共10天
      for (let i = -5; i <= 4; i++) {
        const currentDate = new Date(ovulationDay)
        currentDate.setDate(ovulationDay.getDate() + i)
        ovulationDates.ovulationPeriod.push(formatDate(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate()
        ))
      }
      
      return ovulationDates
    }

    // 工具函数
    const formatDate = (year, month, day) => {
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }

    const parseDate = (dateStr) => {
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(year, month - 1, day)
    }
    // 获取指定日期的心情数据
    const getMoodForDate = (date) => {
      if (!date) return null
      const dateKey = formatDate(date.getFullYear(), date.getMonth(), date.getDate())
      return props.moodRecords?.[dateKey] || null
    }

    // 获取心情表情符号
    const getMoodEmoji = (date) => {
      const moodData = getMoodForDate(date)
      return moodData?.emoji || null
    }

    // 打开心情弹窗
    const openMoodPopup = (day) => {
      if (!day.isOtherMonth) {
        // 先选择这个日期
        emit('date-select', day.date)
        // 然后触发心情点击事件
        emit('mood-click', day.date)
      }
    }

    return {
      weekdays,
      displayMonthYear,
      currentDateDisplay,
      calendarDays,
      getDayClasses,
      selectDate,
      openPeriodModal,
      prevMonth,
      nextMonth,
      getMoodForDate,
      getMoodEmoji, 
      openMoodPopup
    }
  }
}
</script>

<style scoped>
.calendar-main {
  flex: 1;
  /* padding: 30px; */
  display: flex;
  flex-direction: column;
  /* justify-content: center; */
  /* align-items: flex-start; */
  background: white;
}

.calendar-container {
  /* width: 100%; */
  /* max-width: 800px; */
  flex: 1;
  display: flex;
  background: white;
  flex-direction: column;
  /* border-radius: 15px; */
  /* box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); */
  /* overflow: hidden; */
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  background: linear-gradient(135deg, #f4a8c9 0%, #e46f89 100%);
  color: white;
}

.month-year {
  font-size: 1.8rem;
  font-weight: 600;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background 0.3s;
  font-size: 1.1rem;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}


.settings-btn {
  margin-left: 5px;
  font-size: 1.3rem;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8f9fa;
  padding: 15px 0;
  font-weight: 600;
  color: #555;
  font-size: 1.1rem;
}

.weekdays div {
  text-align: center;
}

.days {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #f0f0f0;
  /* min-height: 500px; */
}

.day {
  position: relative;
  background: white;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 8px 5px;
}

.day:hover {
  background: #f8f9ff;
  transform: scale(1.02);
}

.day.selected {
  background: #e3f2fd;
  /* border: 2px solid #a7d3f7; */
}

.today {
  background: #e3f2fd !important;
  color: #9dbfe1;
  font-weight: 600;
}

.today .day-number {
  background: #66a0d9;
  color: white;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.other-month {
  color: #ccc;
}

/* 心情指示器样式 */
.mood-indicator {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e0e0e0;
}

.mood-indicator:hover {
  background: #f0f8ff;
  border-color: #007bff;
  transform: scale(1.1);
}

.mood-indicator.has-mood {
  border: none;
  background: transparent;
  font-size: 14px;
}

.mood-indicator.has-mood:hover {
  transform: scale(1.2);
  background: rgba(255, 255, 255, 0.8);
}

.day-number {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 5px;
  margin-top: 8px; /* 给心情图标留出空间 */
}

.day-hint {
  font-size: 0.7rem;
  color: #999;
  margin-top: 2px;
}

.current-date {
  margin-top: 15px;
  text-align: center;
  padding: 15px;
  color: #666;
  font-size: 1rem;
  border-top: 1px solid #f0f0f0;
}

.period-marked {
  background: #ffebee !important;
  color: #d32f2f;
}

.period-marked::after {
  content: "●";
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 10px;
  color: #f44336;
}

.period-predicted {
  background: #fff0f6 !important;
  border: 2px solid #ffadd2 !important;
}
/* 排卵日样式 - 深紫色 */
.ovulation-day {
  background: #e8d4f7 !important;
  border: 2px solid #ce8fea !important;
}

/* 排卵期样式 - 淡紫色 */
.ovulation-period {
  background: #f3e8fd !important;
  border: 2px solid #bb8fce !important;
}
/* 血量和痛度标记样式*/
.rating-indicators {
  position: absolute;
  bottom: 5px;
  left: 5px;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
}

.blood-indicator,
.pain-indicator {
  display: flex;
  gap: 3px;
  width: 100%;
  justify-content: center;
}

.indicator-rect {
  flex: 1;
  max-width: 22px;
  height: 6px;
  border-radius: 3px;
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.2s;
}

/* 血量标记 - 粉色 */
.blood-indicator .indicator-rect.active {
  background: #f18cac;
  border-color: #f18cac;
}

/* 痛度标记 - 蓝色 */
.pain-indicator .indicator-rect.active {
  background: #76b6ea;
  border-color: #76b6ea;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .mood-indicator {
    width: 18px;
    height: 18px;
    font-size: 10px;
  }
  
  .mood-indicator.has-mood {
    font-size: 12px;
  }
}
</style>