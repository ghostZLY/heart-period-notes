<template>
  <div class="todo-sidebar">
    <div class="todo-header">
      <!-- 用户信息区域 -->
      <div class="user-info" @click="toggleDropdown">
        <div class="avatar">
          <img v-if="userInfo.avatar" :src="userInfo.avatar" alt="头像">
          <div v-else class="default-avatar">
            {{ userInfo.nickname ? userInfo.nickname.charAt(0) : '用' }}
          </div>
        </div>
        <div class="nickname">{{ userInfo.nickname || '用户' }}</div>

        <!-- 下拉菜单 -->
        <div v-if="showDropdown" class="dropdown-menu">
          <div class="dropdown-item" @click="openEditDialog">
            <span>修改信息</span>
          </div>
          <div class="dropdown-item" @click="logout">
            <span>退出登录</span>
          </div>
        </div>
      </div>

      <h2>记事本</h2>
      <div class="selected-date">{{ selectedDateDisplay }}</div>

      <!-- 统计按钮 -->
      <div class="stats-button" @click="openStatsDialog">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3v18h18"></path>
          <path d="M7 16l4-4 4 4 6-6"></path>
        </svg>
      </div>
    </div>

    <!-- 个人信息编辑对话框 -->
    <div v-if="showEditDialog" class="edit-dialog-overlay" @click="showEditDialog = false">
      <div class="edit-dialog" @click.stop>
        <h3>修改个人信息</h3>
        <div class="edit-form">
          <div class="form-group">
            <label>头像</label>
            <div class="avatar-upload">
              <div class="avatar-preview" @click="triggerAvatarUpload">
                <img v-if="editUserInfo.avatar" :src="editUserInfo.avatar" alt="头像预览">
                <div v-else class="default-avatar">
                  {{ editUserInfo.nickname ? editUserInfo.nickname.charAt(0) : '用' }}
                </div>
                <input type="file"
                       ref="avatarInput"
                       @change="handleAvatarUpload"
                       accept="image/*"
                       style="display: none">
              </div>
              <button type="button" @click="triggerAvatarUpload" class="upload-btn">
                选择图片
              </button>
            </div>
          </div>
          <div class="form-group">
            <label for="nickname">昵称</label>
            <input type="text"
                   id="nickname"
                   v-model="editUserInfo.nickname"
                   placeholder="请输入昵称"
                   maxlength="20">
          </div>
          <div class="form-group">
            <label>背景图片</label>
            <div class="background-upload">
              <div class="background-preview" @click="triggerBackgroundUpload">
                <img v-if="editUserInfo.background" :src="editUserInfo.background" alt="背景预览">
                <div v-else class="default-background">
                  <span>点击上传背景</span>
                </div>
                <input type="file"
                       ref="backgroundInput"
                       @change="handleBackgroundUpload"
                       accept="image/*"
                       style="display: none">
              </div>
              <div class="background-controls">
                <button type="button" @click="triggerBackgroundUpload" class="upload-btn">
                  选择背景图片
                </button>
                <button v-if="editUserInfo.background" type="button" @click="removeBackground" class="remove-btn">
                  移除背景
                </button>
              </div>
            </div>
          </div>

          <!-- 背景不透明度调节 -->
          <div v-if="editUserInfo.background" class="form-group">
            <label for="opacity-slider">
              背景不透明度: {{ Math.round(editUserInfo.backgroundOpacity * 100) }}%
            </label>
            <div class="opacity-control">
              <input type="range"
                     id="opacity-slider"
                     v-model.number="editUserInfo.backgroundOpacity"
                     min="0.1"
                     max="1"
                     step="0.05"
                     class="opacity-slider">
              <div class="opacity-preview">
              </div>
            </div>
          </div>

          <div class="dialog-actions">
            <button @click="showEditDialog = false" class="cancel-btn">取消</button>
            <button @click="saveUserInfo" class="save-btn">保存</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计对话框 -->
    <div v-if="showStatsDialog" class="stats-dialog-overlay" @click="showStatsDialog = false">
      <div class="stats-dialog" @click.stop>
        <h3>事项统计</h3>
        <div class="stats-content">
          <div v-if="hasTagData" class="chart-container">
            <canvas ref="chartCanvas"></canvas>
          </div>
          <div v-else class="no-data">
            <p>暂无tag数据</p>
            <p class="hint">请先创建tag并添加相关事项</p>
          </div>
          <div class="stats-summary">
            <div class="summary-item">
              <span class="label">总事项数:</span>
              <span class="value">{{ totalTodosCount }}</span>
            </div>
            <div class="summary-item">
              <span class="label">已标记事项:</span>
              <span class="value">{{ taggedTodosCount }}</span>
            </div>
          </div>
        </div>
        <div class="dialog-actions">
          <button @click="showStatsDialog = false" class="cancel-btn">关闭</button>
        </div>
      </div>
    </div>

    <!-- Tab栏 -->
    <div class="tab-container">
      <button class="tab-button"
              :class="{ active: activeTab === 'today' }"
              @click="activeTab = 'today'">
        今日事项
      </button>
      <button class="tab-button"
              :class="{ active: activeTab === 'all' }"
              @click="activeTab = 'all'">
        所有事项
      </button>
      <button class="tab-button"
              :class="{ active: activeTab === 'search' }"
              @click="activeTab = 'search'">
        搜索
      </button>
      <button class="tab-button"
              :class="{ active: activeTab === 'templates' }"
              @click="activeTab = 'templates'">
        tag管理
      </button>
    </div>

    <div class="todo-content">
      <!-- 待办事项模式 -->
      <div v-if="activeTab !== 'templates'">
        <div class="todo-input-section">
          <div class="input-with-dropdown">
            <!-- 今日事项和所有事项的输入框 -->
            <input v-if="activeTab !== 'search'"
                   type="text"
                   ref="todoInputRef"
                   v-model="newTodoText"
                   @focus="showTagDropdownHandler"
                   @blur="hideTagDropdown"
                   @keyup.enter="addTodo"
                   placeholder="添加新事项...">
            <!-- 搜索事项的输入框 -->
            <input v-else
                   type="text"
                   ref="searchInputRef"
                   v-model="searchText"
                   @focus="showTagDropdownHandler"
                   @blur="hideTagDropdown"
                   @keyup.enter="performSearch"
                   placeholder="搜索事项...">
            <!-- Tag下拉列表 -->
            <div v-if="showTagDropdown && templateTags.length > 0"
                 class="tag-dropdown"
                 ref="tagDropdownRef">
              <div class="tag-dropdown-list">
                <div v-for="tag in templateTags"
                     :key="tag.id"
                     class="tag-dropdown-item"
                     @mousedown="selectTag(tag)">
                  <div class="tag-preview" :style="{ backgroundColor: tag.color }">
                    {{ tag.displayText }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button v-if="activeTab !== 'search'" @click="addTodo">添加</button>
          <button v-else @click="performSearch">搜索</button>
        </div>
        <div class="todo-list">
          <div v-for="todo in filteredTodos"
               :key="todo.id"
               class="todo-item"
               :class="{ completed: todo.completed }">
            <input type="checkbox"
                   :checked="todo.completed"
                   @change="$emit('toggle-todo', todo.id)">
            <span class="todo-text">{{ todo.text }}</span>
            <button class="delete-todo" @click="$emit('delete-todo', todo.id)">×</button>
          </div>
          <div v-if="filteredTodos.length === 0" class="empty-state">
            {{ emptyMessage }}
          </div>
        </div>
      </div>

      <!-- 模板管理模式 -->
      <div v-else class="template-mode">
        <div class="template-list">
          <div v-for="template in templateTags"
               :key="template.id"
               class="template-item">
            <div class="template-tag"
                 :style="{ backgroundColor: template.color }">
              {{ template.displayText }}
            </div>
            <div class="template-actions">
              <button class="edit-btn" @click="$emit('edit-template', template)">
                编辑
              </button>
              <button class="delete-btn" @click="$emit('delete-template', template.id)">
                删除
              </button>
            </div>
          </div>
          <div v-if="templateTags.length === 0" class="empty-templates">
            暂无tag，创建一个吧！
          </div>
        </div>
        <div class="template-footer">
          <button class="new-template-btn" @click="$emit('new-template')">
            新建tag
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { computed, ref, onMounted, watch, nextTick } from 'vue'

  export default {
    name: 'TodoSidebar',
    props: {
      selectedDate: Date,
      todos: Object,
      templateTags: {
        type: Array,
        default: () => []
      }
    },
    emits: ['add-todo', 'toggle-todo', 'delete-todo', 'logout', 'background-change', 'new-template', 'edit-template', 'delete-template'],
    setup(props, { emit }) {
      const newTodoText = ref('')
      const searchText = ref('')
      const activeTab = ref('today')
      const showEditDialog = ref(false)
      const showDropdown = ref(false)
      const avatarInput = ref(null)
      const backgroundInput = ref(null)
      // 搜索相关状态
      const searchResults = ref([])

      // 统计相关状态
      const showStatsDialog = ref(false)
      const chartCanvas = ref(null)
      let chartInstance = null

      // 用户信息
      const userInfo = ref({
        nickname: '',
        avatar: '',
        background: '',
        backgroundOpacity: 0.3
      })

      // 编辑时的用户信息副本
      const editUserInfo = ref({
        nickname: '',
        avatar: '',
        background: '',
        backgroundOpacity: 0.3
      })

      // 下拉列表相关状态
      const showTagDropdown = ref(false)
      const tagDropdownRef = ref(null)
      const todoInputRef = ref(null)
      const searchInputRef = ref(null)

      // 统计相关计算属性
      const tagStatistics = computed(() => {
        const stats = {}
        const allTodos = Object.values(props.todos).flat()

        props.templateTags.forEach(tag => {
          const tagText = tag.displayText || `#${tag.name}#`
          const count = allTodos.filter(todo =>
            todo.text.includes(tagText)
          ).length
          stats[tag.id] = {
            tag,
            count,
            text: tagText
          }
        })

        return stats
      })

      const hasTagData = computed(() => {
        return Object.values(tagStatistics.value).some(stat => stat.count > 0)
      })

      const totalTodosCount = computed(() => {
        return Object.values(props.todos).flat().length
      })

      const taggedTodosCount = computed(() => {
        return Object.values(tagStatistics.value).reduce((sum, stat) => sum + stat.count, 0)
      })

      // 从本地存储加载用户信息
      const loadUserInfo = () => {
        const currentUser = localStorage.getItem('currentUser')
        if (!currentUser) return
        
        const userDataKey = `userInfo_${currentUser}`
        const saved = localStorage.getItem(userDataKey)
        if (saved) {
          const userData = JSON.parse(saved)
          userInfo.value = {
            nickname: userData.nickname || currentUser,
            avatar: userData.avatar || '',
            background: userData.background || '',
            backgroundOpacity: userData.backgroundOpacity || 0.3
          }
          // 通知父组件背景变化
          emitBackgroundChange()
        }
      }

      // 保存用户信息到本地存储
      const saveUserInfo = () => {
        const currentUser = localStorage.getItem('currentUser')
        if (!currentUser) return
        
        userInfo.value = { ...editUserInfo.value }
        const userDataKey = `userInfo_${currentUser}`
        localStorage.setItem(userDataKey, JSON.stringify(userInfo.value))
        showEditDialog.value = false
        // 通知父组件背景变化
        emitBackgroundChange()
      }

      // 发送背景变化事件
      const emitBackgroundChange = () => {
        const backgroundData = {
          image: userInfo.value.background,
          opacity: userInfo.value.backgroundOpacity
        }
        emit('background-change', backgroundData)
      }

      // 切换下拉菜单
      const toggleDropdown = () => {
        showDropdown.value = !showDropdown.value
      }

      // 打开编辑对话框
      const openEditDialog = () => {
        editUserInfo.value = { ...userInfo.value }
        showEditDialog.value = true
        showDropdown.value = false
      }

      // 打开统计对话框
      const openStatsDialog = async () => {
        showStatsDialog.value = true
        await nextTick()
        if (hasTagData.value) {
          renderChart()
        }
      }

      // 渲染饼状图
      const renderChart = () => {
        if (!chartCanvas.value) return

        // 销毁之前的图表实例
        if (chartInstance) {
          chartInstance.destroy()
        }

        // 准备图表数据
        const chartData = Object.values(tagStatistics.value)
          .filter(stat => stat.count > 0)
          .map(stat => ({
            label: stat.tag.name,
            count: stat.count,
            color: stat.tag.color
          }))

        if (chartData.length === 0) return

        // 动态导入Chart.js
        import('chart.js/auto').then(({ default: Chart }) => {
          const ctx = chartCanvas.value.getContext('2d')

          chartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
              labels: chartData.map(item => item.label),
              datasets: [{
                data: chartData.map(item => item.count),
                backgroundColor: chartData.map(item => item.color),
                borderColor: '#fff',
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                      size: 12
                    }
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const label = context.label || '';
                      const value = context.raw || 0;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = Math.round((value / total) * 100);
                      return `${label}: ${value} (${percentage}%)`;
                    }
                  }
                }
              }
            }
          })
        })
      }

      // 退出登录
      const logout = () => {
        localStorage.removeItem('currentUser')
        emit('logout') // 触发父组件的退出登录处理
        showDropdown.value = false
      }

      // 触发头像上传
      const triggerAvatarUpload = () => {
        avatarInput.value?.click()
      }

      // 处理头像上传
      const handleAvatarUpload = (event) => {
        const file = event.target.files[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            editUserInfo.value.avatar = e.target.result
          }
          reader.readAsDataURL(file)
        }
      }

      // 触发背景上传
      const triggerBackgroundUpload = () => {
        backgroundInput.value?.click()
      }

      // 处理背景上传
      const handleBackgroundUpload = (event) => {
        const file = event.target.files[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            editUserInfo.value.background = e.target.result
            // 上传背景后默认设置不透明度为30%
            if (!editUserInfo.value.backgroundOpacity) {
              editUserInfo.value.backgroundOpacity = 0.3
            }
          }
          reader.readAsDataURL(file)
        }
      }

      // 移除背景
      const removeBackground = () => {
        editUserInfo.value.background = ''
        editUserInfo.value.backgroundOpacity = 0.3
      }

      // 执行搜索
      const performSearch = () => {
        if (!searchText.value.trim()) {
          searchResults.value = []
          return
        }

        const searchTerm = searchText.value.toLowerCase().trim()
        const allTodos = Object.values(props.todos).flat()

        searchResults.value = allTodos.filter(todo => {
          // 搜索事项文本和tag内容
          return todo.text.toLowerCase().includes(searchTerm)
        })
      }

      // 根据tab过滤待办事项
      const filteredTodos = computed(() => {
        const dateKey = formatDate(props.selectedDate)
        const todayTodos = props.todos[dateKey] || []

        switch (activeTab.value) {
          case 'today':
            return todayTodos
          case 'all':
            return Object.values(props.todos).flat()
          case 'search':
            return searchResults.value
          default:
            return todayTodos
        }
      })

      // 空状态提示信息
      const emptyMessage = computed(() => {
        switch (activeTab.value) {
          case 'today':
            return '暂无事项，添加一个吧！'
          case 'all':
            return '还没有任何待办事项'
          case 'search':
            return searchText.value ? '没有找到匹配的事项' : '请输入搜索内容'
          default:
            return '暂无事项'
        }
      })

      // 当前选中日期的待办事项
      const currentTodos = computed(() => {
        const dateKey = formatDate(props.selectedDate)
        return props.todos[dateKey] || []
      })

      // 选中日期显示
      const selectedDateDisplay = computed(() => {
        if (isToday(props.selectedDate)) {
          return '今天'
        } else if (isTomorrow(props.selectedDate)) {
          return '明天'
        } else if (isYesterday(props.selectedDate)) {
          return '昨天'
        } else {
          return props.selectedDate.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })
        }
      })

      // 显示tag下拉列表
      const showTagDropdownHandler = () => {
        if (props.templateTags.length > 0) {
          showTagDropdown.value = true
        }
      }

      // 隐藏tag下拉列表
      const hideTagDropdown = () => {
        showTagDropdown.value = false
      }

      // 选择tag
      const selectTag = (tag) => {
        const displayText = tag.displayText || `#${tag.name}#`

        // 根据当前激活的tab选择输入框
        if (activeTab.value === 'search') {
          // 搜索模式
          if (!searchText.value.trim()) {
            searchText.value = displayText
          } else {
            searchText.value = searchText.value.trim() + ' ' + displayText
          }

          // 聚焦到搜索框
          if (searchInputRef.value) {
            searchInputRef.value.focus()
          }
        } else {
          // 添加事项模式
          if (!newTodoText.value.trim()) {
            newTodoText.value = displayText
          } else {
            newTodoText.value = newTodoText.value.trim() + ' ' + displayText
          }

          // 聚焦到输入框
          if (todoInputRef.value) {
            todoInputRef.value.focus()
          }
        }
        // 隐藏下拉列表
        hideTagDropdown()
      }

      // 添加待办事项
      const addTodo = () => {
        if (newTodoText.value.trim()) {
          emit('add-todo', newTodoText.value.trim())
          newTodoText.value = ''
          hideTagDropdown()
        }
      }

      // 监听搜索文本变化，实时搜索
      watch(searchText, (newValue) => {
        if (newValue.trim() && activeTab.value === 'search') {
          performSearch()
        } else if (!newValue.trim() && activeTab.value === 'search') {
          searchResults.value = []
        }
      })

      // 监听tab切换，清空搜索状态
      watch(activeTab, (newTab) => {
        if (newTab !== 'search') {
          searchText.value = ''
          searchResults.value = []
        }
      })

      // 监听todos变化，更新图表
      watch(() => props.todos, () => {
        if (showStatsDialog.value && hasTagData.value) {
          nextTick(() => {
            renderChart()
          })
        }
      }, { deep: true })

      // 监听templateTags变化，更新图表
      watch(() => props.templateTags, () => {
        if (showStatsDialog.value && hasTagData.value) {
          nextTick(() => {
            renderChart()
          })
        }
      }, { deep: true })

      // 工具函数
      const formatDate = (date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      }

      const isToday = (date) => {
        const today = new Date()
        return date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
      }

      const isTomorrow = (date) => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return date.getDate() === tomorrow.getDate() &&
          date.getMonth() === tomorrow.getMonth() &&
          date.getFullYear() === tomorrow.getFullYear()
      }

      const isYesterday = (date) => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        return date.getDate() === yesterday.getDate() &&
          date.getMonth() === yesterday.getMonth() &&
          date.getFullYear() === yesterday.getFullYear()
      }

      // 组件挂载时加载用户信息
      onMounted(() => {
        loadUserInfo()
      })

      return {
        newTodoText,
        searchText,
        activeTab,
        filteredTodos,
        emptyMessage,
        currentTodos,
        selectedDateDisplay,
        userInfo,
        editUserInfo,
        showEditDialog,
        showDropdown,
        avatarInput,
        backgroundInput,
        showStatsDialog,
        chartCanvas,
        tagStatistics,
        hasTagData,
        totalTodosCount,
        taggedTodosCount,
        addTodo,
        performSearch,
        toggleDropdown,
        openEditDialog,
        openStatsDialog,
        logout,
        saveUserInfo,
        triggerAvatarUpload,
        handleAvatarUpload,
        triggerBackgroundUpload,
        handleBackgroundUpload,
        removeBackground,
        showTagDropdown,
        tagDropdownRef,
        todoInputRef,
        searchInputRef,
        showTagDropdownHandler,
        hideTagDropdown,
        selectTag,
        loadUserInfo,
        emitBackgroundChange
      }
    }
  }
</script>

<style scoped>
  .todo-sidebar {
    width: 500px;
    background: #f8f9fa;
    border-right: 1px solid #e9ecef;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 10;
  }

  .todo-header {
    padding: 11px 25px;
    background: linear-gradient(135deg, #e46f89 0%, #f4a8c9 100%);
    color: white;
    position: relative;
  }

    .todo-header h2 {
      font-size: 1.8rem;
      margin-bottom: 8px;
      text-align: center;
    }

  .selected-date {
    font-size: 1rem;
    opacity: 0.9;
    text-align: center;
  }

  /* 统计按钮样式 */
  .stats-button {
    position: absolute;
    top: 15px;
    right: 25px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    color: white;
  }

    .stats-button:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

  /* 统计对话框样式 */
  .stats-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .stats-dialog {
    background: white;
    border-radius: 15px;
    padding: 30px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
  }

    .stats-dialog h3 {
      margin-bottom: 20px;
      text-align: center;
      color: #333;
      font-size: 1.5rem;
    }

  .stats-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .chart-container {
    height: 300px;
    position: relative;
    margin-bottom: 20px;
  }

  .no-data {
    text-align: center;
    padding: 60px 20px;
    color: #6c757d;
  }

    .no-data .hint {
      font-size: 0.9rem;
      margin-top: 10px;
      opacity: 0.7;
    }

  .stats-summary {
    display: flex;
    justify-content: space-around;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 10px;
    margin-top: 10px;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

    .summary-item .label {
      font-size: 0.9rem;
      color: #6c757d;
    }

    .summary-item .value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #e46f89;
    }

  /* 用户信息样式 */
  .user-info {
    position: absolute;
    top: 15px;
    left: 25px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 25px;
    transition: background-color 0.3s;
  }

    .user-info:hover {
      background: rgba(255, 255, 255, 0.2);
    }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }

  .default-avatar {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: white;
    font-size: 1.2rem;
  }

  .nickname {
    font-size: 1rem;
    font-weight: 500;
    color: white;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 下拉菜单样式 - 确保完全不透明 */
  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    background: white !important;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    min-width: 140px;
    z-index: 1001 !important;
    margin-top: 5px;
    overflow: hidden;
    opacity: 1 !important;
  }

  .dropdown-item {
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.3s;
    color: #333;
    font-size: 0.9rem;
    background: white !important;
    opacity: 1 !important;
  }

    .dropdown-item:hover {
      background: #f8f9fa !important;
    }

    .dropdown-item:not(:last-child) {
      border-bottom: 1px solid #f0f0f0;
    }

  /* 编辑对话框样式 - 确保完全不透明 */
  .edit-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000 !important;
    opacity: 1 !important;
  }

  .edit-dialog {
    background: white !important;
    border-radius: 15px;
    padding: 30px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-height: 80vh;
    overflow-y: auto;
    opacity: 1 !important;
    z-index: 1001;
  }

    .edit-dialog h3 {
      margin-bottom: 20px;
      text-align: center;
      color: #333;
      font-size: 1.5rem;
    }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

    .form-group label {
      font-weight: 500;
      color: #555;
    }

  .avatar-upload, .background-upload {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    flex-wrap: wrap;
  }

  .background-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .avatar-preview {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 2px dashed #ddd;
    position: relative;
  }

  .background-preview {
    width: 120px;
    height: 80px;
    border-radius: 8px;
    overflow: hidden;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 2px dashed #ddd;
    position: relative;
  }

    .avatar-preview img, .background-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }

  .avatar-preview .default-avatar {
    background: linear-gradient(135deg, #e46f89 0%, #f4a8c9 100%);
    border-radius: 50%;
  }

  .default-background {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 0.8rem;
    text-align: center;
    padding: 10px;
  }

  .avatar-preview:hover, .background-preview:hover {
    border-color: #e46f89;
  }

  .upload-btn, .remove-btn {
    padding: 8px 16px;
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.3s;
  }

  .upload-btn {
    background: #f8f9fa;
    color: #333;
  }

    .upload-btn:hover {
      background: #e9ecef;
      border-color: #e46f89;
    }

  .remove-btn {
    background: #e46f89;
    color: white;
    border-color: #e46f89;
  }

    .remove-btn:hover {
      background: #c82333;
      border-color: #bd2130;
    }

  /* 不透明度控制样式 */
  .opacity-control {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .opacity-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #e1e5e9;
    outline: none;
    -webkit-appearance: none;
  }

    .opacity-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #e46f89;
      cursor: pointer;
    }

    .opacity-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #e46f89;
      cursor: pointer;
      border: none;
    }

  .opacity-preview {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.8rem;
    color: #666;
  }

  .preview-bar {
    width: 60px;
    height: 20px;
    background: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  .preview-fill {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #e46f89 0%, #f4a8c9 100%);
    transition: opacity 0.3s ease;
  }

  .edit-dialog input[type="text"] {
    padding: 12px 15px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s;
  }

    .edit-dialog input[type="text"]:focus {
      border-color: #e46f89;
      outline: none;
    }

  .dialog-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 10px;
  }

  .cancel-btn, .save-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95rem;
    transition: all 0.3s;
  }

  .cancel-btn {
    background: #6c757d;
    color: white;
  }

    .cancel-btn:hover {
      background: #5a6268;
    }

  .save-btn {
    background: #e46f89;
    color: white;
  }

    .save-btn:hover {
      background: #d65a7a;
    }

  /* Tab栏样式 */
  .tab-container {
    display: flex;
    background: white;
    border-bottom: 1px solid #e9ecef;
    padding: 0 25px;
  }

  .tab-button {
    flex: 1;
    padding: 15px 0;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    color: #6c757d;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.3s ease;
  }

    .tab-button:hover {
      color: #e46f89;
      background-color: #f8f9fa;
    }

    .tab-button.active {
      color: #e46f89;
      background-color: #fffafc;
    }

  .todo-content {
    flex: 1;
    padding: 25px;
    display: flex;
    flex-direction: column;
  }

  .todo-input-section {
    display: flex;
    gap: 10px;
    margin-bottom: 25px;
    position: relative;
  }

  .input-with-dropdown {
    flex: 1;
    position: relative;
    display: flex;
  }

  input[type="text"] {
    width: 100%;
    padding: 12px 15px;
    border: 2px solid #e1e5e9;
    border-radius: 10px;
    font-size: 1rem;
    transition: border-color 0.3s;
    box-sizing: border-box;
  }

    input[type="text"]:focus {
      border-color: #eadf66;
      outline: none;
    }

  button {
    padding: 12px 20px;
    background: #f7de63;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.3s;
  }

    button:hover {
      background: #f2d235;
    }

  .todo-list {
    flex: 1;
    overflow-y: auto;
    max-height: calc(100vh - 300px);
    min-height: 0;
  }

  .todo-item {
    display: flex;
    align-items: center;
    padding: 15px;
    background: white;
    border-radius: 10px;
    margin-bottom: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s;
  }

    .todo-item:hover {
      transform: translateY(-2px);
    }

    .todo-item input[type="checkbox"] {
      margin-right: 12px;
      width: 18px;
      height: 18px;
    }

  .todo-text {
    flex: 1;
    font-size: 1rem;
  }

  .todo-item.completed .todo-text {
    text-decoration: line-through;
    color: #6c757d;
  }

  .delete-todo {
    background: none;
    border: none;
    color: #dc3545;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 5px;
  }

  .empty-state {
    text-align: center;
    color: #6c757d;
    padding: 40px 20px;
    font-style: italic;
  }

  /* 模板管理相关样式 */
  .template-mode {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .template-list {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 20px;
    max-height: calc(100vh - 300px);
    min-height: 0;
  }

  .template-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px;
    background: white;
    border-radius: 10px;
    margin-bottom: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .template-tag {
    padding: 8px 16px;
    border-radius: 20px;
    color: white;
    font-weight: 600;
    font-size: 0.9rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .template-actions {
    display: flex;
    gap: 8px;
  }

  .edit-btn, .delete-btn {
    padding: 6px 12px !important;
    font-size: 0.8rem !important;
    border-radius: 6px !important;
  }

  .edit-btn {
    background: #a8e6cf !important;
    color: #333 !important;
  }

    .edit-btn:hover {
      background: #8cdbb9 !important;
    }

  .delete-btn {
    background: #ffd3b6 !important;
    color: #333 !important;
  }

    .delete-btn:hover {
      background: #ffc4a1 !important;
    }

  .empty-templates {
    text-align: center;
    color: #6c757d;
    padding: 40px 20px;
    font-style: italic;
  }

  .template-footer {
    border-top: 1px solid #e9ecef;
    padding-top: 20px;
  }

  .new-template-btn {
    width: 100%;
    background: #ffaaa5 !important;
    color: white !important;
  }

    .new-template-btn:hover {
      background: #ff8b84 !important;
    }

  /* Tag下拉列表样式 */
  .tag-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 1001;
    margin-top: 5px;
    max-height: 200px;
    overflow-y: auto;
  }

  .tag-dropdown-list {
    padding: 8px;
  }

  .tag-dropdown-item {
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 6px;
    transition: background-color 0.2s;
    margin-bottom: 4px;
  }

    .tag-dropdown-item:hover {
      background-color: #f8f9fa;
    }

    .tag-dropdown-item:last-child {
      margin-bottom: 0;
    }

  .tag-preview {
    padding: 6px 12px;
    border-radius: 16px;
    color: white;
    font-weight: 600;
    font-size: 0.85rem;
    display: inline-block;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style>