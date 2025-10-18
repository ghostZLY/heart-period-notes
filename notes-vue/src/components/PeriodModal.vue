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
    width: 350px;
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
  }

    .option:hover {
      background: #e9ecef;
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