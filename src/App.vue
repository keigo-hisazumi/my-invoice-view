<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth'
import ToastNotification from './components/ToastNotification.vue'
import AdminSubmenu from './components/AdminSubmenu.vue'

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
        </div>
        <div v-if="!isLoginPage && currentUser" class="header-user">
          <AdminSubmenu :email="currentUser.email ?? ''" @logout="handleLogout" />
        </div>
      </div>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
  <ToastNotification />
</template>

<style scoped>
.app {
  min-height: 100vh;
}

.app-header {
  background: #3D7DFF;
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

.header-user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}


main {
  padding: 20px;
}

@media (max-width: 768px) {
  .app-header {
    padding: 20px 16px;
  }

  .header-inner {
    display: grid;
    grid-template-columns: 40px 1fr 40px;
    align-items: center;
    position: static;
  }

  .header-text {
    grid-column: 2;
    position: static;
    transform: none;
    text-align: center;
  }

  .header-user {
    grid-column: 3;
    margin-left: 0;
    justify-self: end;
  }

  .app-header h1 {
    font-size: 24px;
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

  main {
    padding: 12px 8px;
  }
}
</style>
