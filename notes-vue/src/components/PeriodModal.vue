<template>
  <div class="modal">
    <div class="modal-content">
      <span class="close" @click="$emit('close')">&times;</span>
      <h3>选择标记</h3>
      <div class="option-list">
        <div class="option" data-type="period" @click="$emit('mark-period')">生理期</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PeriodModal',
  emits: ['close', 'mark-period']
}
</script>

<style scoped>
.option-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  text-align: center;
  font-size: 1.1rem;
}

.option:hover {
  background: #e9ecef;
}

.option[data-type="period"] {
  border-left: 4px solid #f44336;
}
</style>