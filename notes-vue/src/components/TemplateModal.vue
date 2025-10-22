<template>
  <div class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ isEditing ? '编辑tag' : '新建tag' }}</h3>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label for="template-name">tag名称</label>
          <input
            id="template-name"
            type="text"
            v-model="formData.name"
            placeholder="输入tag名称..."
            maxlength="20"
          >
        </div>
        
        <div class="form-group">
          <label>背景颜色</label>
          <div class="color-picker">
            <div
              v-for="color in presetColors"
              :key="color"
              class="color-option"
              :class="{ selected: formData.color === color }"
              :style="{ backgroundColor: color }"
              @click="formData.color = color"
            ></div>
            <div class="color-custom">
              <input
                type="color"
                v-model="formData.color"
                class="color-input"
              >
              <span>自定义</span>
            </div>
          </div>
        </div>
        
        <div class="preview">
          <label>预览效果</label>
          <div
            class="template-preview"
            :style="{ backgroundColor: formData.color }"
          >
            #{{ formData.name || 'tag名称' }}#
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-cancel" @click="close">取消</button>
        <button class="btn-save" @click="save" :disabled="!formData.name.trim()">
          {{ isEditing ? '保存' : '创建' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'TemplateModal',
  props: {
    template: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const formData = ref({
      name: '',
      color: '#007bff'
    })

    const presetColors = [
      '#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1',
      '#e83e8c', '#fd7e14', '#20c997', '#17a2b8', '#6c757d'
    ]

    const isEditing = computed(() => !!props.template)

    // 监听template prop的变化，初始化表单数据
    watch(() => props.template, (newTemplate) => {
      if (newTemplate) {
        formData.value = {
          name: newTemplate.name,
          color: newTemplate.color
        }
      } else {
        formData.value = {
          name: '',
          color: '#007bff'
        }
      }
    }, { immediate: true })

    const close = () => {
      emit('close')
    }

    const save = () => {
      if (formData.value.name.trim()) {
        emit('save', {
          name: formData.value.name.trim(),
          color: formData.value.color
        })
      }
    }

    return {
      formData,
      presetColors,
      isEditing,
      close,
      save
    }
  }
}
</script>

<style scoped>
.modal-overlay {
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

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.4rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #6c757d;
  padding: 5px;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 30px;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

input[type="text"] {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input[type="text"]:focus {
  border-color: #007bff;
  outline: none;
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.color-option {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.2s, border-color 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: #333;
  transform: scale(1.1);
}

.color-custom {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.color-custom span {
  font-size: 0.9rem;
  color: #6c757d;
}

.preview {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.template-preview {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  margin-top: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 30px;
  border-top: 1px solid #e9ecef;
}

.btn-cancel, .btn-save {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background: #5a6268;
}

.btn-save {
  background: #007bff;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #0056b3;
}

.btn-save:disabled {
  background: #b3d7ff;
  cursor: not-allowed;
}
</style>
