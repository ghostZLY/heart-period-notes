<template>
  <div class="modal">
    <div class="modal-content">
      <span class="close" @click="closeModal">&times;</span>
      <h3>选择标记</h3>
      
      <!-- 生理期标记选项 - 点击立即生效并关闭 -->
      <div class="option-list">
        <div class="option" data-type="period" @click="handlePeriodMark">
          生理期
          <span v-if="isPeriodMarked" class="marked-badge">已标记</span>
        </div>
      </div>
      
      <!-- 血量等级选择 -->
      <div class="rating-section">
        <div class="rating-label">血量</div>
        <div class="rating-container">
          <div 
            v-for="level in 3" 
            :key="'blood-' + level"
            class="rating-option-blood"
            :class="{ active: bloodLevel >= level }"
            @click="selectBloodLevel(level)"
          >
            <div class="rating-icon"></div>
          </div>
          <button class="reset-btn" @click="resetBloodLevel">重置</button>
        </div>
      </div>
      
      <!-- 痛度等级选择 -->
      <div class="rating-section">
        <div class="rating-label">痛度</div>
        <div class="rating-container">
          <div 
            v-for="level in 3" 
            :key="'pain-' + level"
            class="rating-option-pain"
            :class="{ active: painLevel >= level }"
            @click="selectPainLevel(level)"
          >
            <div class="rating-icon"></div>
          </div>
          <button class="reset-btn" @click="resetPainLevel">重置</button>
        </div>
      </div>
      
      <!-- 保存按钮 - 只在有等级标记变化时显示 -->
      <div v-if="hasRatingChanges" class="action-buttons">
        <button class="save-btn" @click="saveRatings">保存标记</button>
        <button class="cancel-btn" @click="closeModal">取消</button>
      </div>
      
      <!-- 没有等级标记变化时的关闭按钮 -->
      <div v-else class="action-buttons">
        <button class="close-btn" @click="closeModal">关闭</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PeriodModal',
  emits: ['close', 'mark-period', 'save-ratings'],
  props: {
    selectedDate: String,
    existingRatings: Object,
    isPeriodDate: Boolean  // 新增prop，表示当前日期是否已标记为生理期
  },
  data() {
    return {
      bloodLevel: 0,
      painLevel: 0,
      initialBloodLevel: 0,  // 记录初始值用于比较变化
      initialPainLevel: 0,
      hasChanges: false      // 标记是否有未保存的等级变化
    }
  },
  computed: {
    // 检查是否有等级标记变化
    hasRatingChanges() {
      return this.bloodLevel !== this.initialBloodLevel || 
             this.painLevel !== this.initialPainLevel
    },
    // 检查是否已标记为生理期
    isPeriodMarked() {
      return this.isPeriodDate
    }
  },
  watch: {
    // 监听等级变化
    bloodLevel() {
      this.checkChanges()
    },
    painLevel() {
      this.checkChanges()
    }
  },
  mounted() {
    // 初始化等级数据
    if (this.existingRatings) {
      this.bloodLevel = this.existingRatings.bloodLevel || 0
      this.painLevel = this.existingRatings.painLevel || 0
    }
    // 记录初始值
    this.initialBloodLevel = this.bloodLevel
    this.initialPainLevel = this.painLevel
  },
  methods: {
    selectBloodLevel(level) {
      this.bloodLevel = level
    },
    selectPainLevel(level) {
      this.painLevel = level
    },
    resetBloodLevel() {
      this.bloodLevel = 0
    },
    resetPainLevel() {
      this.painLevel = 0
    },
    // 检查是否有变化
    checkChanges() {
      this.hasChanges = this.hasRatingChanges
    },
    // 处理生理期标记 - 立即生效并关闭
    handlePeriodMark() {
      this.$emit('mark-period')
      // this.closeModal()
    },
    // 保存等级标记
    saveRatings() {
      this.$emit('save-ratings', {
        bloodLevel: this.bloodLevel,
        painLevel: this.painLevel
      })
      // this.closeModal()
    },
    // 关闭弹窗
    closeModal() {
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.modal {
  display: flex;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  opacity: 1 !important;
}

.modal-content {
  background-color: white !important;
  padding: 25px;
  border-radius: 15px;
  width: 380px;
  position: relative;
  animation: modalSlideIn 0.3s ease;
  opacity: 1 !important;
}

.close {
  position: absolute;
  right: 20px;
  top: 15px;
  font-size: 24px;
  cursor: pointer;
  color: #aaa;
}

.close:hover {
  color: #000;
}

.modal-content h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 1.3rem;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 25px;
}

.option {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  text-align: center;
  font-size: 1.1rem;
  opacity: 1 !important;
  border: 2px solid transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.option:hover {
  background: #e9ecef;
  border-color: #f18cac;
}

.marked-badge {
  background: #f18cac;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
}

.rating-section {
  margin-bottom: 20px;
}

.rating-label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #555;
  font-size: 1rem;
}

.rating-container {
  display: flex;
  gap: 8px;
  align-items: center;
}

.rating-option-blood {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 32px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.rating-option-blood:hover {
  border-color: #f5a4be;
}

.rating-option-blood.active {
  border-color: #f18cac;
  background: #f18cac;
}

.rating-option-pain {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 32px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.rating-option-pain:hover {
  border-color: #bbdefb;
}

.rating-option-pain.active {
  border-color: #76b6ea;
  background: #76b6ea;
}

.rating-icon {
  /* width: 12px; */
  height: 6px;
  background: white;
  border-radius: 2px;
}

.reset-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #e9ecef;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.save-btn, .cancel-btn, .close-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.save-btn {
  background: #f18cac;
  color: white;
}

.save-btn:hover {
  background: #e8799c;
}

.cancel-btn {
  background: #f8f9fa;
  color: #666;
}

.cancel-btn:hover {
  background: #e9ecef;
}

.close-btn {
  background: #6c757d;
  color: white;
}

.close-btn:hover {
  background: #5a6268;
}

@keyframes modalSlideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>