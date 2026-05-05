<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth'

const route = useRoute()
const router = useRouter()

const isLoginPage = computed(() => route.name === 'login')

const { currentUser, logout } = useAuth()

const handleLogout = async () => {
  await logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="header-inner">
        <div class="header-text">
          <h1>請求書作成システム</h1>
          <p>請求書を作成・管理できます</p>
        </div>
        <div v-if="!isLoginPage && currentUser" class="header-user">
          <span class="user-name">{{ currentUser.email }} さん</span>
          <button @click="handleLogout" class="btn-logout">ログアウト</button>
        </div>
      </div>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  position: relative;
}

.header-text {
  text-align: center;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  min-width: 0;
}

.app-header h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
  word-break: break-word;
}

.app-header p {
  margin: 10px 0 0;
  font-size: 16px;
  opacity: 0.9;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.user-name {
  font-size: 14px;
  opacity: 0.95;
}

.btn-logout {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.25);
}

main {
  padding: 20px;
}

@media (max-width: 768px) {
  .app-header {
    padding: 20px 16px;
  }

  .header-inner {
    flex-direction: column;
    gap: 12px;
    position: static;
  }

  .header-text {
    position: static;
    transform: none;
    width: auto;
  }

  .app-header h1 {
    font-size: 24px;
  }

  .app-header p {
    font-size: 14px;
    margin-top: 6px;
  }

  main {
    padding: 16px 12px;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 16px 12px;
  }

  .app-header h1 {
    font-size: 20px;
  }

  .app-header p {
    font-size: 13px;
  }

  .header-user {
    flex-wrap: wrap;
    justify-content: center;
  }

  main {
    padding: 12px 8px;
  }
}
</style>
