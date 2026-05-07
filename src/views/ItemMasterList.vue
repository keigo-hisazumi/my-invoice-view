<template>
  <div class="item-list">
    <div class="list-header">
      <button @click="goToInvoices" class="btn-back">← 請求書一覧</button>
      <h2>品目管理</h2>
      <button @click="goToCreate" class="btn-create">+ 新規追加</button>
    </div>

    <div v-if="items.length === 0" class="empty-state">
      <p>品目がまだ登録されていません</p>
      <button @click="goToCreate" class="btn-create-large">最初の品目を追加する</button>
    </div>

    <div v-else class="item-table-container">
      <table class="item-table">
        <thead>
          <tr>
            <th class="sortable" @click="setSort('description')">
              品名<span class="sort-icon">{{ sortKey === 'description' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ' ↕' }}</span>
            </th>
            <th class="sortable" @click="setSort('unitPrice')">
              単価<span class="sort-icon">{{ sortKey === 'unitPrice' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ' ↕' }}</span>
            </th>
            <th class="sortable" @click="setSort('unit')">
              単位<span class="sort-icon">{{ sortKey === 'unit' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ' ↕' }}</span>
            </th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in sortedItems" :key="item.id" class="item-row">
            <td data-label="品名" class="name">{{ item.description }}</td>
            <td data-label="単価" class="price">￥{{ item.unitPrice.toLocaleString() }}</td>
            <td data-label="単位">{{ item.unit || '-' }}</td>
            <td data-label="操作" class="actions">
              <button @click="editItem(item.id)" class="btn-edit">編集</button>
              <button @click="deleteItem(item.id)" class="btn-delete">削除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { authReady } from '../router'
import type { ItemMaster } from '../types/invoice'

const router = useRouter()
const items = ref<ItemMaster[]>([])
let unsubscribe: (() => void) | null = null

type SortKey = 'description' | 'unitPrice' | 'unit'
const sortKey = ref<SortKey>('description')
const sortOrder = ref<'asc' | 'desc'>('asc')

const sortedItems = computed(() => {
  return [...items.value].sort((a, b) => {
    const aVal = a[sortKey.value]
    const bVal = b[sortKey.value]
    let cmp = 0
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      cmp = aVal - bVal
    } else {
      cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''), 'ja')
    }
    return sortOrder.value === 'asc' ? cmp : -cmp
  })
})

const setSort = (key: SortKey) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

onMounted(async () => {
  await authReady
  const uid = auth.currentUser?.uid
  if (!uid) return

  const q = query(
    collection(db, 'itemMasters'),
    where('uid', '==', uid)
  )

  unsubscribe = onSnapshot(q, (snapshot) => {
    items.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ItemMaster))
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

const goToInvoices = () => router.push('/')
const goToCreate = () => router.push('/items/create')
const editItem = (id: string) => router.push(`/items/edit/${id}`)

const deleteItem = async (id: string) => {
  if (confirm('この品目を削除してもよろしいですか？')) {
    try {
      await deleteDoc(doc(db, 'itemMasters', id))
    } catch (e) {
      console.error(e)
      alert('削除中にエラーが発生しました。もう一度お試しください。')
    }
  }
}
</script>

<style scoped>
.item-list {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.item-list * {
  box-sizing: border-box;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 30px;
}

.list-header h2 {
  color: #2c3e50;
  margin: 0;
  flex: 1;
  text-align: center;
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

.btn-create {
  padding: 12px 24px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-create:hover {
  background: #229954;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-state p {
  font-size: 18px;
  color: #666;
  margin-bottom: 30px;
}

.btn-create-large {
  padding: 15px 40px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-create-large:hover {
  background: #2980b9;
}

.item-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.item-table {
  width: 100%;
  border-collapse: collapse;
}

.item-table thead {
  background: #f8f9fa;
}

.item-table th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
}

.item-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.item-table th.sortable:hover {
  background: #edf0f2;
}

.sort-icon {
  font-size: 11px;
  color: #888;
}

.item-table tbody tr {
  border-bottom: 1px solid #e9ecef;
  transition: background 0.2s;
}

.item-table tbody tr:hover {
  background: #f8f9fa;
}

.item-table td {
  padding: 15px;
  color: #555;
}

.item-table td.name {
  font-weight: 600;
  color: #2c3e50;
}

.item-table td.price {
  font-weight: 600;
  color: #2c3e50;
}

.item-table td.actions {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;
}

.btn-edit {
  background: #f39c12;
  color: white;
}

.btn-edit:hover {
  opacity: 0.8;
}

.btn-delete {
  background: #e74c3c;
  color: white;
}

.btn-delete:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .item-list {
    padding: 12px;
  }

  .list-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    margin-bottom: 20px;
  }

  .list-header h2 {
    text-align: center;
    font-size: 20px;
    order: -1;
  }

  .btn-back,
  .btn-create {
    width: 100%;
  }

  .item-table-container {
    background: transparent;
    box-shadow: none;
    overflow-x: visible;
  }

  .item-table,
  .item-table tbody,
  .item-table tr,
  .item-table td {
    display: block;
    width: 100%;
  }

  .item-table thead {
    display: none;
  }

  .item-table tbody tr {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    margin-bottom: 12px;
    padding: 8px 12px;
  }

  .item-table tbody tr:hover {
    background: white;
  }

  .item-table td {
    padding: 10px 0;
    border-bottom: 1px solid #f1f3f5;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    text-align: right;
    word-break: break-word;
  }

  .item-table td:last-child {
    border-bottom: none;
  }

  .item-table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #2c3e50;
    text-align: left;
    flex-shrink: 0;
  }

  .item-table td.actions {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  .item-table td.actions::before {
    width: 100%;
    margin-bottom: 4px;
  }

  .btn-edit,
  .btn-delete {
    flex: 1;
    min-width: 72px;
    padding: 10px 12px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .item-list {
    padding: 8px;
  }

  .list-header h2 {
    font-size: 20px;
  }

  .empty-state {
    padding: 48px 16px;
  }

  .empty-state p {
    font-size: 16px;
  }

  .btn-create-large {
    width: 100%;
    padding: 14px 20px;
    font-size: 16px;
  }
}
</style>
