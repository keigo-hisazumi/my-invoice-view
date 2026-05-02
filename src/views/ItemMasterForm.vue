<template>
  <div class="item-form">
    <div class="form-header">
      <button @click="goBack" class="btn-back">← 一覧に戻る</button>
      <h2>{{ isEdit ? '品目を編集' : '品目を追加' }}</h2>
      <div class="header-actions">
        <button @click="saveItem" class="btn-save">保存</button>
      </div>
    </div>

    <div class="form-section">
      <h3>品目情報</h3>
      <div class="form-group">
        <label>品名 <span class="required">*</span></label>
        <input v-model="item.description" type="text" placeholder="例: リズム録音" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>単価</label>
          <input v-model.number="item.unitPrice" type="number" step="1" placeholder="0" />
        </div>
        <div class="form-group">
          <label>単位</label>
          <input v-model="item.unit" type="text" placeholder="例: 時間、曲" />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ItemMaster } from '../types/invoice'

const route = useRoute()
const router = useRouter()

const STORAGE_KEY = 'itemMasters'

const editId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : ''
})

const isEdit = computed(() => editId.value !== '')

const item = reactive<ItemMaster>({
  id: '',
  description: '',
  unitPrice: 0,
  unit: '',
  createdAt: '',
  updatedAt: ''
})

const loadAll = (): ItemMaster[] => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  try {
    return JSON.parse(stored)
  } catch (e) {
    console.error('Failed to load item masters:', e)
    return []
  }
}

const loadForEdit = () => {
  const all = loadAll()
  const found = all.find(i => i.id === editId.value)
  if (!found) {
    alert('指定された品目が見つかりません')
    router.push('/items')
    return
  }
  Object.assign(item, found)
}

const goBack = () => {
  router.push('/items')
}

const saveItem = () => {
  if (!item.description.trim()) {
    alert('品名を入力してください')
    return
  }

  const all = loadAll()
  const now = new Date().toISOString()

  if (isEdit.value) {
    const index = all.findIndex(i => i.id === editId.value)
    if (index === -1) {
      alert('編集対象が見つかりませんでした')
      return
    }
    all[index] = {
      ...item,
      id: editId.value,
      updatedAt: now
    }
  } else {
    all.push({
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    })
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  alert(isEdit.value ? '品目を更新しました' : '品目を追加しました')
  router.push('/items')
}

onMounted(() => {
  if (isEdit.value) {
    loadForEdit()
  }
})
</script>

<style scoped>
.item-form {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.item-form * {
  box-sizing: border-box;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-header h2 {
  margin: 0;
  color: #2c3e50;
}

.btn-back {
  padding: 10px 20px;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-back:hover {
  background: #7f8c8d;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-save {
  padding: 10px 24px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-save:hover {
  background: #229954;
}

.form-section {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h3 {
  color: #34495e;
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #3498db;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #555;
  font-weight: 500;
}

.required {
  color: #e74c3c;
  margin-left: 4px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
}

@media (max-width: 768px) {
  .item-form {
    padding: 12px;
  }

  .form-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    padding: 16px;
  }

  .form-header h2 {
    text-align: center;
    font-size: 20px;
  }

  .btn-back {
    width: 100%;
    padding: 12px;
  }

  .header-actions {
    justify-content: stretch;
  }

  .btn-save {
    width: 100%;
    padding: 12px;
  }

  .form-section {
    padding: 16px;
  }

  .form-group input,
  .form-group textarea {
    font-size: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .item-form {
    padding: 8px;
  }

  .form-header,
  .form-section {
    padding: 14px;
  }

  h3 {
    font-size: 16px;
  }
}
</style>
