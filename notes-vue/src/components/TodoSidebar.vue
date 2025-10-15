<template>
  <div class="todo-sidebar">
    <div class="todo-header">
      <h2>记事本</h2>
      <div class="selected-date">{{ selectedDateDisplay }}</div>
    </div>
    <div class="todo-content">
      <div class="todo-input-section">
        <input
          type="text"
          v-model="newTodoText"
          @keyup.enter="addTodo"
          placeholder="添加新事项..."
        >
        <button @click="addTodo">添加</button>
      </div>
      <div class="todo-list">
        <div
          v-for="todo in currentTodos"
          :key="todo.id"
          class="todo-item"
          :class="{ completed: todo.completed }"
        >
          <input
            type="checkbox"
            :checked="todo.completed"
            @change="$emit('toggle-todo', todo.id)"
          >
          <span class="todo-text">{{ todo.text }}</span>
          <button class="delete-todo" @click="$emit('delete-todo', todo.id)">×</button>
        </div>
        <div v-if="currentTodos.length === 0" class="empty-state">
          暂无事项，添加一个吧！
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'

export default {
  name: 'TodoSidebar',
  props: {
    selectedDate: Date,
    todos: Object
  },
  emits: ['add-todo', 'toggle-todo', 'delete-todo'],
  setup(props, { emit }) {
    const newTodoText = ref('')

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

    // 添加待办事项
    const addTodo = () => {
      if (newTodoText.value.trim()) {
        emit('add-todo', newTodoText.value.trim())
        newTodoText.value = ''
      }
    }

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

    return {
      newTodoText,
      currentTodos,
      selectedDateDisplay,
      addTodo
    }
  }
}
</script>

<style scoped>
.todo-sidebar {
  width: 350px;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
}

.todo-header {
  padding: 30px 25px;
  background: linear-gradient(135deg, #e46f89 0%, #f4a8c9 100%);
  color: white;
}

.todo-header h2 {
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.selected-date {
  font-size: 1rem;
  opacity: 0.9;
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
}

input[type="text"] {
  flex: 1;
  padding: 12px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s;
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
</style>