<template>
  <div class="login-modal">
    <div class="login-container">
      <div class="login-header">
        <h2>{{ isLoginMode ? '登录' : '注册' }}</h2>
      </div>

      <div class="login-form">
        <div class="form-group">
          <label for="username">账号</label>
          <input type="text"
                 id="username"
                 v-model="form.username"
                 placeholder="请输入账号">
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input type="password"
                 id="password"
                 v-model="form.password"
                 placeholder="请输入密码">
        </div>

        <button class="submit-btn" @click="handleSubmit">
          {{ isLoginMode ? '登录' : '注册' }}
        </button>

        <div class="switch-mode">
          <span @click="toggleMode">
            {{ isLoginMode ? '没有账号？点击注册' : '已有账号？点击登录' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { ref, reactive } from 'vue'

  export default {
    name: 'LoginModal',
    emits: ['login-success'],
    setup(props, { emit }) {
      const isLoginMode = ref(true)
      const form = reactive({
        username: '',
        password: ''
      })

      // 初始化用户数据
      const initializeUserData = (username) => {
        const userDataKey = `userInfo_${username}`
        const periodSettingsKey = `periodSettings_${username}`
        const moodRecordsKey = `moodRecords_${username}`
        const templateTagsKey = `templateTags_${username}`
        // 初始化用户个人信息
        if (!localStorage.getItem(userDataKey)) {
          const defaultUserInfo = {
            nickname: username,
            avatar: '',
            background: '',
            backgroundOpacity: 0.3
          }
          localStorage.setItem(userDataKey, JSON.stringify(defaultUserInfo))
        }
        
        // 初始化生理期设置
        if (!localStorage.getItem(periodSettingsKey)) {
          const defaultSettings = {
            duration: 6,
            interval: 28
          }
          localStorage.setItem(periodSettingsKey, JSON.stringify(defaultSettings))
        }
        // 初始化模板标签
        if (!localStorage.getItem(templateTagsKey)) {
          localStorage.setItem(templateTagsKey, JSON.stringify([]))
        }
        // 初始化心情记录
        if (!localStorage.getItem(moodRecordsKey)) {
          localStorage.setItem(moodRecordsKey, JSON.stringify({}))
        }
      }


      // 切换登录/注册模式
      const toggleMode = () => {
        isLoginMode.value = !isLoginMode.value
        form.username = ''
        form.password = ''
      }

      // 处理提交
      const handleSubmit = () => {
        if (!form.username.trim() || !form.password.trim()) {
          alert('请输入账号和密码')
          return
        }

        if (isLoginMode.value) {
          // 登录逻辑
          const users = JSON.parse(localStorage.getItem('users') || '{}')
          if (users[form.username] && users[form.username] === form.password) {
            localStorage.setItem('currentUser', form.username)
            // 初始化用户数据（如果不存在）
            initializeUserData(form.username)
            emit('login-success')
          } else {
            alert('账号或密码错误')
          }
        } else {
          // 注册逻辑
          const users = JSON.parse(localStorage.getItem('users') || '{}')
          if (users[form.username]) {
            alert('账号已存在')
          } else {
            users[form.username] = form.password
            localStorage.setItem('users', JSON.stringify(users))
            localStorage.setItem('currentUser', form.username)
            // 初始化新用户数据
            initializeUserData(form.username)
            alert('注册成功！')
            emit('login-success')
          }
        }
      }

      return {
        isLoginMode,
        form,
        toggleMode,
        handleSubmit,
        initializeUserData
      }
    }
  }
</script>

<style scoped>
  .login-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #f4a8c9 0%, #e46f89 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    opacity: 1 !important;
  }

  .login-container {
    background: white !important;
    padding: 40px;
    border-radius: 15px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    width: 90%;
    max-width: 400px;
    opacity: 1 !important;
  }

  .login-header {
    text-align: center;
    margin-bottom: 30px;
    opacity: 1 !important;
  }

    .login-header h2 {
      color: #e46f89;
      font-size: 2rem;
      margin: 0;
      font-weight: 600;
      opacity: 1 !important;
    }

  .form-group {
    margin-bottom: 20px;
    opacity: 1 !important;
  }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #666;
      font-weight: 500;
      opacity: 1 !important;
    }

    .form-group input {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #f0f0f0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s;
      box-sizing: border-box;
      background: #fafafa;
      opacity: 1 !important;
    }

      .form-group input:focus {
        border-color: #e46f89;
        background: white;
        outline: none;
        box-shadow: 0 0 0 3px rgba(228, 111, 137, 0.1);
      }

  .submit-btn {
    width: 100%;
    padding: 12px;
    background: #e46f89;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s;
    margin-bottom: 20px;
    font-weight: 500;
    opacity: 1 !important;
  }

    .submit-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(228, 111, 137, 0.3);
    }

  .switch-mode {
    text-align: center;
    opacity: 1 !important;
  }

    .switch-mode span {
      color: #e46f89;
      cursor: pointer;
      transition: color 0.3s;
      font-weight: 500;
      opacity: 1 !important;
    }

      .switch-mode span:hover {
        color: #d45a7a;
        text-decoration: underline;
      }
</style>