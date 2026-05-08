<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  email: string
}>()

const emit = defineEmits<{
  logout: []
}>()

const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const router = useRouter()

const toggle = () => {
  isOpen.value = !isOpen.value
}

const close = () => {
  isOpen.value = false
}

const navigate = (routeName: string) => {
  router.push({ name: routeName })
  close()
}

const handleLogout = () => {
  emit('logout')
  close()
}

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="admin-submenu" ref="menuRef">
    <button @click.stop="toggle" class="submenu-trigger" :class="{ active: isOpen }">
      <span class="trigger-user-name">{{ email }}</span>
      <span class="trigger-arrow" :class="{ open: isOpen }">&#9660;</span>
    </button>
    <div v-if="isOpen" class="submenu-dropdown">
      <div class="submenu-user-section">
        <span class="submenu-user-label">ログイン中</span>
        <span class="submenu-user-email">{{ email }}</span>
      </div>
      <div class="submenu-divider"></div>
      <nav class="submenu-nav">
        <button @click="navigate('billing-source-list')" class="submenu-item">
          請求元管理
        </button>
        <button @click="navigate('billing-address-list')" class="submenu-item">
          請求先管理
        </button>
        <button @click="navigate('item-master-list')" class="submenu-item">
          品目管理
        </button>
      </nav>
      <div class="submenu-divider"></div>
      <button @click="handleLogout" class="submenu-logout">
        ログアウト
      </button>
    </div>
  </div>
</template>

<style scoped>
.admin-submenu {
  position: relative;
}

.submenu-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
  white-space: nowrap;
}

.submenu-trigger:hover,
.submenu-trigger.active {
  background: rgba(255, 255, 255, 0.25);
}

.trigger-user-name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trigger-arrow {
  font-size: 10px;
  transition: transform 0.2s;
  opacity: 0.8;
}

.trigger-arrow.open {
  transform: rotate(180deg);
}

.submenu-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
}

.submenu-user-section {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.submenu-user-label {
  font-size: 11px;
  color: #888;
  font-weight: 500;
}

.submenu-user-email {
  font-size: 13px;
  color: #333;
  font-weight: 600;
  word-break: break-all;
}

.submenu-divider {
  height: 1px;
  background: #eee;
}

.submenu-nav {
  padding: 6px 0;
}

.submenu-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  text-align: left;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background 0.15s;
}

.submenu-item:hover {
  background: #f5f0ff;
  color: #764ba2;
}

.submenu-logout {
  display: block;
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  text-align: left;
  font-size: 14px;
  color: #e53e3e;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.15s;
}

.submenu-logout:hover {
  background: #fff5f5;
}

@media (max-width: 480px) {
  .trigger-user-name {
    max-width: 120px;
  }

  .submenu-dropdown {
    right: 0;
    min-width: 180px;
  }
}
</style>
