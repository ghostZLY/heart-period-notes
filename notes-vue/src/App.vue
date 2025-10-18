<template>
  <div class="app-container">
    <!-- 背景层 -->
    <div v-if="background.image" class="background-layer" :style="backgroundStyle"></div>

    <!-- 登录弹窗 -->
    <LoginModal v-if="!isLoggedIn"
                @login-success="handleLoginSuccess" />

    <!-- 主应用内容 -->
    <div v-if="isLoggedIn" class="app-content" :style="contentStyle">
      <!-- 左侧记事栏 -->
      <TodoSidebar :selectedDate="selectedDate"
                   :todos="todos"
                   @add-todo="addTodo"
                   @toggle-todo="toggleTodo"
                   @delete-todo="deleteTodo"
                   @logout="handleLogout"
                   @background-change="handleBackgroundChange" />

      <!-- 右侧日历 -->
      <Calendar :currentDate="currentDate"
                :selectedDate="selectedDate"
                :periodDates="periodDates"
                :periodSettings="periodSettings"
                @date-select="selectDate"
                @month-change="changeMonth"
                @period-mark="openPeriodModal"
                @open-settings="openPeriodSettings" />

      <!-- 弹窗组件 -->
      <PeriodModal v-if="showPeriodModal"
                   @close="closePeriodModal"
                   @mark-period="markPeriod" />

      <PeriodSettings v-if="showPeriodSettings"
                      :settings="periodSettings"
                      @close="closePeriodSettings"
                      @save-settings="savePeriodSettings" />
    </div>
  </div>
</template>

<script>
  import { ref, onMounted, reactive, computed } from 'vue'
  import TodoSidebar from './components/TodoSidebar.vue'
  import Calendar from './components/Calendar.vue'
  import PeriodModal from './components/PeriodModal.vue'
  import PeriodSettings from './components/PeriodSettings.vue'
  import LoginModal from './components/LoginModal.vue'

  export default {
    name: 'App',
    components: {
      TodoSidebar,
      Calendar,
      PeriodModal,
      PeriodSettings,
      LoginModal
    },
    setup() {
      const isLoggedIn = ref(false)
      const currentDate = ref(new Date())
      const selectedDate = ref(new Date())
      const showPeriodModal = ref(false)
      const showPeriodSettings = ref(false)

      // 背景设置
      const background = reactive({
        image: '',
        opacity: 0.3
      })

      // 从本地存储加载数据
      const todos = ref(JSON.parse(localStorage.getItem('todos')) || {})
      const periodDates = ref(JSON.parse(localStorage.getItem('periodDates')) || [])
      const periodSettings = ref(JSON.parse(localStorage.getItem('periodSettings')) || {
        duration: 6,
        interval: 28
      })

      // 计算样式 - 弹窗和下拉菜单不受背景透明度影响
      const backgroundStyle = computed(() => {
        if (!background.image) {
          return {}
        }
        return {
          backgroundImage: `url(${background.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }
      })

      const contentStyle = computed(() => {
        if (!background.image) {
          return { opacity: 1 }
        }
        return {
          opacity: 1 - background.opacity
        }
      })

      // 检查登录状态
      const checkLoginStatus = () => {
        const currentUser = localStorage.getItem('currentUser')
        isLoggedIn.value = !!currentUser
      }

      // 处理登录成功
      const handleLoginSuccess = () => {
        isLoggedIn.value = true
        // 登录后加载用户背景设置
        loadBackgroundFromStorage()
      }

      // 处理退出登录
      const handleLogout = () => {
        isLoggedIn.value = false
        // 清除当前用户信息，但保留背景设置
        localStorage.removeItem('currentUser')
      }

      // 处理背景变化
      const handleBackgroundChange = (backgroundData) => {
        background.image = backgroundData.image
        background.opacity = backgroundData.opacity
        saveBackgroundToStorage()
      }

      // 从本地存储加载背景设置
      const loadBackgroundFromStorage = () => {
        const saved = localStorage.getItem('userInfo')
        if (saved) {
          const userData = JSON.parse(saved)
          background.image = userData.background || ''
          background.opacity = userData.backgroundOpacity || 0.3
        }
      }

      // 保存背景设置到本地存储
      const saveBackgroundToStorage = () => {
        const saved = localStorage.getItem('userInfo')
        if (saved) {
          const userData = JSON.parse(saved)
          userData.background = background.image
          userData.backgroundOpacity = background.opacity
          localStorage.setItem('userInfo', JSON.stringify(userData))
        }
      }

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
        // 检查登录状态
        checkLoginStatus()
        // 加载背景设置
        loadBackgroundFromStorage()
      })

      return {
        isLoggedIn,
        currentDate,
        selectedDate,
        todos,
        periodDates,
        periodSettings,
        showPeriodModal,
        showPeriodSettings,
        background,
        backgroundStyle,
        contentStyle,
        handleLoginSuccess,
        handleLogout,
        handleBackgroundChange,
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

<style>
  .app-container {
    width: 100%;
    height: 100vh;
    position: relative;
  }

  .background-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .app-content {
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 2;
    transition: opacity 0.3s ease;
  }

  /* 确保所有弹窗和下拉菜单都在最顶层且完全不透明 */
  .modal,
  .edit-dialog-overlay,
  .dropdown-menu,
  .login-modal {
    z-index: 1000 !important;
    opacity: 1 !important;
  }

  .modal-content,
  .edit-dialog,
  .dropdown-menu,
  .login-container {
    opacity: 1 !important;
    background: white !important;
  }
</style>