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
                   :templateTags="templateTags"
                   @add-todo="addTodo"
                   @toggle-todo="toggleTodo"
                   @delete-todo="deleteTodo"
                   @logout="handleLogout"
                   @background-change="handleBackgroundChange"
                   @new-template="openTemplateModal"
                   @edit-template="openTemplateModal"
                   @delete-template="deleteTemplate" />

      <!-- 右侧日历 -->
      <Calendar :currentDate="currentDate"
                :selectedDate="selectedDate"
                :periodDates="periodDates"
                :periodSettings="periodSettings"
                :moodRecords="moodRecords"
                :dayRatings="dayRatings"
                @date-select="selectDate"
                @month-change="changeMonth"
                @period-mark="openPeriodModal"
                @mood-click="openMoodPopup"
                @open-stats="openStatsPopup"
                @open-settings="openPeriodSettings" />

      <!-- 弹窗组件 -->
      <PeriodModal v-if="showPeriodModal"
                   :selectedDate="currentDateStr"
                   :existingRatings="currentDateRatings"
                   :isPeriodDate="isPeriodDate"
                   @close="closePeriodModal"
                   @mark-period="markPeriod"
                   @save-ratings="saveRatings" />
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
      <!-- ↓↓↓ 在这里添加统计弹窗 ↓↓↓ -->
      <StatsPopup 
        :visible="showStatsPopup"
        :selectedDate="selectedDate"
        :moodData="moodRecordsArray"
        @close="closeStatsPopup"
      />
      <!-- ↑↑↑ 添加到这里结束 ↑↑↑ -->

      <PeriodSettings v-if="showPeriodSettings"
                      :settings="periodSettings"
                      @close="closePeriodSettings"
                      @save-settings="savePeriodSettings" />

      <TemplateModal
        v-if="showTemplateModal"
        :template="editingTemplate"
        @close="closeTemplateModal"
        @save="saveTemplate"
      />
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
  import TemplateModal from './components/TemplateModal.vue'
  import MoodPopup from './components/MoodPopup.vue'
  import StatsPopup from './components/StatsPopup.vue'  // 添加这行

  export default {
    name: 'App',
    components: {
      TodoSidebar,
      Calendar,
      PeriodModal,
      PeriodSettings,
      LoginModal,
      TemplateModal,
      MoodPopup,  // 新增心情弹窗组件
      StatsPopup //心情统计
    },
  setup() {
      const currentUsername = ref('')
      const isLoggedIn = ref(false)
      const currentDate = ref(new Date())
      const selectedDate = ref(new Date())
      const showPeriodModal = ref(false)
      const showPeriodSettings = ref(false)
    
    // 心情弹窗相关状态
      const showMoodPopup = ref(false)  // 控制心情弹窗显示/隐藏
      const popupDate = ref(new Date())  // 弹窗对应的日期

      // 背景设置
      const background = reactive({
        image: '',
        opacity: 0.3
      })

         // 数据状态 - 初始化为空，在登录后加载
      const todos = ref({})
      const periodDates = ref([])
      const periodSettings = ref({
        duration: 6,
        interval: 28
      })
      const templateTags = ref([])
      const showTemplateModal = ref(false)
      const editingTemplate = ref(null)
      const dayRatings = ref({})
      const moodRecords = ref({})
      //统计弹窗状态
      const showStatsPopup = ref(false)
      const getUserDataKey = (baseKey) => {
        return currentUsername.value ? `${baseKey}_${currentUsername.value}` : baseKey
      }
      // 从本地存储加载用户数据
      const loadUserData = () => {
        if (!currentUsername.value) return
        
        const todosData = localStorage.getItem(getUserDataKey('todos'))
        const periodDatesData = localStorage.getItem(getUserDataKey('periodDates'))
        const periodSettingsData = localStorage.getItem(getUserDataKey('periodSettings'))
        const dayRatingsData = localStorage.getItem(getUserDataKey('dayRatings'))
        const templateTagsData = localStorage.getItem(getUserDataKey('templateTags'))
        const moodRecordsData = localStorage.getItem(getUserDataKey('moodRecords'))
        
        todos.value = todosData ? JSON.parse(todosData) : {}
        periodDates.value = periodDatesData ? JSON.parse(periodDatesData) : []
        periodSettings.value = periodSettingsData ? JSON.parse(periodSettingsData) : {
          duration: 6,
          interval: 28
        }
        dayRatings.value = dayRatingsData ? JSON.parse(dayRatingsData) : {}
        templateTags.value = templateTagsData ? JSON.parse(templateTagsData) : []
        moodRecords.value = moodRecordsData ? JSON.parse(moodRecordsData) : {}
        
        // 加载背景设置
        loadBackgroundFromStorage()
      }

    
      // 计算属性 - 统一使用字符串格式
      const currentDateStr = computed(() => formatDate(selectedDate.value))
      const currentDateRatings = computed(() => dayRatings.value[currentDateStr.value] || null)
      const isPeriodDate = computed(() => periodDates.value.includes(currentDateStr.value))
      // 转换心情数据格式
      const moodRecordsArray = computed(() => {
        if (!moodRecords.value) return []
        
        return Object.entries(moodRecords.value).map(([dateStr, moodData]) => {
          const [year, month, day] = dateStr.split('-').map(Number)
          return {
            date: new Date(year, month - 1, day),
            mood: moodData.mood,
            note: moodData.note,
            emoji: moodData.emoji,
            timestamp: moodData.timestamp
          }
        })
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
        if (currentUser) {
          isLoggedIn.value = true
          currentUsername.value = currentUser
          loadUserData()
        } else {
          isLoggedIn.value = false
          currentUsername.value = ''
        }
      }

      // 处理登录成功
      const handleLoginSuccess = () => {
        const currentUser = localStorage.getItem('currentUser')
        if (currentUser) {
          isLoggedIn.value = true
          currentUsername.value = currentUser
          loadUserData() // 重新加载用户数据
          // loadBackgroundFromStorage()
        }
      }

      // 处理退出登录
      const handleLogout = () => {
        isLoggedIn.value = false
        currentUsername.value = ''
        localStorage.removeItem('currentUser')
        // 重置数据状态
        todos.value = {}
        periodDates.value = []
        dayRatings.value = {}
        moodRecords.value = {}
        templateTags.value = []
        periodSettings.value = {
          duration: 6,
          interval: 28
        }
        background.image = ''
        background.opacity = 0.3
      }

      // 处理背景变化
      const handleBackgroundChange = (backgroundData) => {
        background.image = backgroundData.image
        background.opacity = backgroundData.opacity
        saveBackgroundToStorage()
      }

      // 从本地存储加载背景设置
      const loadBackgroundFromStorage = () => {
        if (!currentUsername.value) return
        
        const userDataKey = getUserDataKey('userInfo')
        const saved = localStorage.getItem(userDataKey)
        if (saved) {
          const userData = JSON.parse(saved)
          background.image = userData.background || ''
          background.opacity = userData.backgroundOpacity || 0.3
        }
      }

      // 保存背景设置到本地存储
      const saveBackgroundToStorage = () => {
        if (!currentUsername.value) return
        
        const userDataKey = getUserDataKey('userInfo')
        const saved = localStorage.getItem(userDataKey)
        let userData = {}
        if (saved) {
          userData = JSON.parse(saved)
        }
        userData.background = background.image
        userData.backgroundOpacity = background.opacity
        localStorage.setItem(userDataKey, JSON.stringify(userData))
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
        const dateStr = currentDateStr.value
        const index = periodDates.value.indexOf(dateStr)
        
        if (index > -1) {
          // 取消标记
          periodDates.value.splice(index, 1)
          // 移除对应的等级标记
          if (dayRatings.value[dateStr]) {
            delete dayRatings.value[dateStr]
            saveDayRatings()
          }
        } else {
          // 添加标记
          periodDates.value.push(dateStr)
        }
        savePeriodDates()
        closePeriodModal()
      }
      // 保存等级标记
      const saveRatings = (ratings) => {
        const dateStr = currentDateStr.value
        
        if (ratings.bloodLevel > 0 || ratings.painLevel > 0) {
          // 有等级标记，保存
          dayRatings.value[dateStr] = ratings
        } else {
          // 没有等级标记，移除
          delete dayRatings.value[dateStr]
        }
        
        saveDayRatings()
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
      if (currentUsername.value) {
        localStorage.setItem(getUserDataKey('periodSettings'), JSON.stringify(settings))
      }
      closePeriodSettings()
    }

      // 打开模板弹窗
      const openTemplateModal = (template = null) => {
        editingTemplate.value = template
        showTemplateModal.value = true
      }

      // 关闭模板弹窗
      const closeTemplateModal = () => {
        showTemplateModal.value = false
        editingTemplate.value = null
      }

      // 保存模板
      const saveTemplate = (templateData) => {
        if (editingTemplate.value) {
          // 编辑现有模板
          const index = templateTags.value.findIndex(t => t.id === editingTemplate.value.id)
          if (index > -1) {
            templateTags.value[index] = {
              ...templateData,
              displayText: `#${templateData.name}#`
            }
          }
        } else {
          // 添加新模板
          templateTags.value.push({
            id: Date.now(),
            ...templateData,
            displayText: `#${templateData.name}#`
          })
        }
        saveTemplateTags()
        closeTemplateModal()
      }

      // 删除模板
      const deleteTemplate = (templateId) => {
        if (confirm('确定要删除这个模板吗？')) {
          templateTags.value = templateTags.value.filter(t => t.id !== templateId)
          saveTemplateTags()
        }
      }

      // 保存模板数据到本地存储
      const saveTemplateTags = () => {
        if (currentUsername.value) {
          localStorage.setItem(getUserDataKey('templateTags'), JSON.stringify(templateTags.value))
        }
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
        saveMoodRecords()
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
      }
      // 打开统计弹窗
      const openStatsPopup = () => {
        showStatsPopup.value = true
      }
      
      // 关闭统计弹窗
      const closeStatsPopup = () => {
        showStatsPopup.value = false
      }

      // 保存数据到本地存储
      const saveTodos = () => {
        if (currentUsername.value) {
          localStorage.setItem(getUserDataKey('todos'), JSON.stringify(todos.value))
        }
      }

      const savePeriodDates = () => {
        if (currentUsername.value) {
          localStorage.setItem(getUserDataKey('periodDates'), JSON.stringify(periodDates.value))
        }
      }

      const saveDayRatings = () => {
        if (currentUsername.value) {
          localStorage.setItem(getUserDataKey('dayRatings'), JSON.stringify(dayRatings.value))
        }
      }
      const saveMoodRecords = () => {
        if (currentUsername.value) {
          localStorage.setItem(getUserDataKey('moodRecords'), JSON.stringify(moodRecords.value))
        }
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
        // loadBackgroundFromStorage()
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
      isLoggedIn,
      templateTags,
      showTemplateModal,
      editingTemplate,
      background,
      backgroundStyle,
      contentStyle,
      dayRatings,
      currentDateStr,
      currentDateRatings,
      isPeriodDate,
      showStatsPopup,
      moodRecordsArray,
      currentUsername,
      loadUserData,
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
      savePeriodSettings,
      // 心情弹窗相关方法
      openMoodPopup,
      closeMoodPopup,
      handleSaveMood,
      handleAddEvent,
      handleMarkPeriod,
      getMoodDataForDate,
      saveRatings,
      openTemplateModal,
      closeTemplateModal,
      saveTemplate,
      deleteTemplate,
      openStatsPopup,
      closeStatsPopup,
      saveMoodRecords
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
