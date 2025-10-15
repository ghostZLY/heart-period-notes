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
      @date-select="selectDate"
      @month-change="changeMonth"
      @period-mark="openPeriodModal" 
      @open-settings="openPeriodSettings"
    />
    
    <!-- 弹窗组件 -->
    <PeriodModal
      v-if="showPeriodModal"
      @close="closePeriodModal"
      @mark-period="markPeriod"
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

export default {
  name: 'App',
  components: {
    TodoSidebar,
    Calendar,
    PeriodModal,
    PeriodSettings
  },
  setup() {
    const currentDate = ref(new Date())
    const selectedDate = ref(new Date())
    const showPeriodModal = ref(false)
    const showPeriodSettings = ref(false)
    
    // 从本地存储加载数据
    const todos = ref(JSON.parse(localStorage.getItem('todos')) || {})
    const periodDates = ref(JSON.parse(localStorage.getItem('periodDates')) || [])
    const periodSettings = ref(JSON.parse(localStorage.getItem('periodSettings')) || {
      duration: 6,
      interval: 28
    })

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
      savePeriodSettings
    }
  }
}
</script>