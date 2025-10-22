<template>
  <div class="app-container">
    <!-- 左侧记事栏 -->
    <TodoSidebar 
      :selectedDate="selectedDate"
      :todos="todos"
      @add-todo="addTodo"
      @toggle-todo="toggleTodo"
      @delete-todo="deleteTodo"
    />
    
    <!-- 右侧日历 -->
    <Calendar
      :currentDate="currentDate"
      :selectedDate="selectedDate"
      :periodDates="periodDates"
      :periodSettings="periodSettings"
      :moodRecords="moodRecords"
      @date-select="selectDate"
      @month-change="changeMonth"
      @period-mark="openPeriodModal" 
      @open-settings="openPeriodSettings"
      @mood-click="openMoodPopup"

    />
    
    <!-- 弹窗组件 -->
    <PeriodModal
      v-if="showPeriodModal"
      @close="closePeriodModal"
      @mark-period="markPeriod"
    />

    <!-- 心情弹窗 -->
    <MoodPopup
      :visible="showMoodPopup"
      :selectedDate="popupDate"
      :savedMoodData="getMoodDataForDate(popupDate)"
      @close="closeMoodPopup"
      @save-mood="handleSaveMood"
      @add-event="handleAddEvent"
      @mark-period="handleMarkPeriod"
    />
    
    <PeriodSettings
      v-if="showPeriodSettings"
      :settings="periodSettings"
      @close="closePeriodSettings"
      @save-settings="savePeriodSettings"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import TodoSidebar from './components/TodoSidebar.vue'
import Calendar from './components/Calendar.vue'
import PeriodModal from './components/PeriodModal.vue'
import PeriodSettings from './components/PeriodSettings.vue'
import MoodPopup from './components/MoodPopup.vue'

export default {
  name: 'App',
  components: {
    TodoSidebar,
    Calendar,
    PeriodModal,
    PeriodSettings,
    MoodPopup  // 新增心情弹窗组件
  },
  setup() {
    const currentDate = ref(new Date())
    const selectedDate = ref(new Date())
    const showPeriodModal = ref(false)
    const showPeriodSettings = ref(false)
    
    // 心情弹窗相关状态
    const showMoodPopup = ref(false)  // 控制心情弹窗显示/隐藏
    const popupDate = ref(new Date())  // 弹窗对应的日期
    
    // 从本地存储加载数据
    const todos = ref(JSON.parse(localStorage.getItem('todos')) || {})
    const periodDates = ref(JSON.parse(localStorage.getItem('periodDates')) || [])
    const periodSettings = ref(JSON.parse(localStorage.getItem('periodSettings')) || {
      duration: 6,
      interval: 28
    })
    // === 新增：心情数据存储 ===
    const moodRecords = ref(JSON.parse(localStorage.getItem('moodRecords')) || {})

    // 选择日期
    const selectDate = (date) => {
      selectedDate.value = date
    }

    // 切换月份
    const changeMonth = (date) => {
      currentDate.value = date
    }

    // 添加待办事项
    const addTodo = (text) => {
      const dateKey = formatDate(selectedDate.value)
      if (!todos.value[dateKey]) {
        todos.value[dateKey] = []
      }
      todos.value[dateKey].push({
        id: Date.now(),
        text,
        completed: false
      })
      saveTodos()
    }

    // 切换待办事项状态
    const toggleTodo = (todoId) => {
      const dateKey = formatDate(selectedDate.value)
      const todo = todos.value[dateKey]?.find(t => t.id === todoId)
      if (todo) {
        todo.completed = !todo.completed
        saveTodos()
      }
    }

    // 删除待办事项
    const deleteTodo = (todoId) => {
      const dateKey = formatDate(selectedDate.value)
      if (todos.value[dateKey]) {
        todos.value[dateKey] = todos.value[dateKey].filter(t => t.id !== todoId)
        saveTodos()
      }
    }

    // 打开生理期标记弹窗
    const openPeriodModal = () => {
      showPeriodModal.value = true
    }

    // 关闭生理期标记弹窗
    const closePeriodModal = () => {
      showPeriodModal.value = false
    }

    // 标记生理期
    const markPeriod = () => {
      const dateStr = formatDate(selectedDate.value)
      const index = periodDates.value.indexOf(dateStr)
      if (index > -1) {
        periodDates.value.splice(index, 1)
      } else {
        periodDates.value.push(dateStr)
      }
      savePeriodDates()
      closePeriodModal()
    }

    // 打开生理期设置
    const openPeriodSettings = () => {
      showPeriodSettings.value = true
    }

    // 关闭生理期设置
    const closePeriodSettings = () => {
      showPeriodSettings.value = false
    }

    // 保存生理期设置
    const savePeriodSettings = (settings) => {
      periodSettings.value = settings
      localStorage.setItem('periodSettings', JSON.stringify(settings))
      closePeriodSettings()
    }

    // === 心情弹窗相关方法 ===
    
    // 打开心情弹窗
    const openMoodPopup = (date) => {
      popupDate.value = date  // 设置弹窗对应的日期
      showMoodPopup.value = true  // 显示心情弹窗
    }

    // 关闭心情弹窗
    const closeMoodPopup = () => {
      showMoodPopup.value = false  // 隐藏心情弹窗
    }

    // 处理保存心情
    const handleSaveMood = (moodData) => {
      console.log('保存心情:', moodData)
      // 生成日期键
      const dateKey = formatDate(moodData.date)
      
      // 将心情数据保存到 moodRecords 中
      moodRecords.value[dateKey] = {
        mood: moodData.mood,
        note: moodData.note,
        emoji: moodData.emoji,
        timestamp: new Date().toISOString()
      }
      // 实现保存心情逻辑，可以保存到 localStorage
      localStorage.setItem('moodRecords', JSON.stringify(moodRecords.value))
      // 例如：localStorage.setItem('moodRecords', JSON.stringify(moodData))
      // 关闭弹窗
      closeMoodPopup()
      console.log('心情已保存:', moodData)
    }

    // 获取指定日期的心情数据
    const getMoodDataForDate = (date) => {
      const dateKey = formatDate(date)
      return moodRecords.value[dateKey] || null
    }

    // 处理添加事件
    const handleAddEvent = (date) => {
      console.log('添加事件:', date)
      // 实现添加事件逻辑
    }

    // 处理标记生理期
    const handleMarkPeriod = (date) => {
      console.log('标记生理期:', date)
      // 实现标记生理期逻辑
    }

    // 保存数据到本地存储
    const saveTodos = () => {
      localStorage.setItem('todos', JSON.stringify(todos.value))
    }

    const savePeriodDates = () => {
      localStorage.setItem('periodDates', JSON.stringify(periodDates.value))
    }

    // 格式化日期
    const formatDate = (date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    onMounted(() => {
      // 初始化选中日期为今天
      selectedDate.value = new Date()
    })

    return {
      currentDate,
      selectedDate,
      todos,
      periodDates,
      periodSettings,
      showPeriodModal,
      showPeriodSettings,
      // 心情弹窗相关返回值
      showMoodPopup,
      popupDate,
      moodRecords,
      selectDate,
      changeMonth,
      addTodo,
      toggleTodo,
      deleteTodo,
      openPeriodModal,
      closePeriodModal,
      markPeriod,
      openPeriodSettings,
      closePeriodSettings,
      savePeriodSettings,
      // 心情弹窗相关方法
      openMoodPopup,
      closeMoodPopup,
      handleSaveMood,
      handleAddEvent,
      handleMarkPeriod,
      getMoodDataForDate
    }
  }
}
</script>