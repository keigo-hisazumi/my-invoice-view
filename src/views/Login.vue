<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">ログイン</h2>
      <p class="login-subtitle">請求書作成システムへようこそ</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">ユーザー名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="user"
            autocomplete="username"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">パスワード</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="password"
            autocomplete="current-password"
            required
          />
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? 'ログイン中...' : 'ログイン' }}
        </button>
      </form>

      <p class="login-hint">
        ※ ダミー認証: ユーザー名 <code>user</code> / パスワード <code>password</code>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

const DUMMY_USERNAME = 'user'
const DUMMY_PASSWORD = 'password'

const handleLogin = () => {
  errorMessage.value = ''
  loading.value = true

  setTimeout(() => {
    if (username.value === DUMMY_USERNAME && password.value === DUMMY_PASSWORD) {
      localStorage.setItem('auth', JSON.stringify({ username: username.value, loggedInAt: new Date().toISOString() }))
      const redirect = (route.query.redirect as string) || '/'
      router.push(redirect)
    } else {
      errorMessage.value = 'ユーザー名またはパスワードが正しくありません'
      loading.value = false
    }
  }, 300)
}
</script>

<style scoped>
.login-container {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 40px 32px;
}

.login-title {
  margin: 0 0 8px;
  text-align: center;
  color: #2c3e50;
  font-size: 24px;
}

.login-subtitle {
  margin: 0 0 28px;
  text-align: center;
  color: #777;
  font-size: 14px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.form-group input {
  padding: 10px 12px;
  border: 1px solid #d0d7de;
  border-radius: 4px;
  font-size: 15px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.error-message {
  margin: 0;
  padding: 10px 12px;
  background: #fdecea;
  color: #c0392b;
  border-radius: 4px;
  font-size: 14px;
}

.btn-login {
  margin-top: 6px;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-login:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-hint {
  margin: 24px 0 0;
  text-align: center;
  color: #888;
  font-size: 12px;
}

.login-hint code {
  background: #f4f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  color: #c0392b;
}
</style>
