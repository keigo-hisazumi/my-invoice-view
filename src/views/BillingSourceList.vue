<template>
  <div class="source-list">
    <div class="list-header">
      <button @click="goToInvoices" class="btn-back">← 請求書一覧</button>
      <h2>請求元一覧</h2>
      <button @click="goToCreate" class="btn-create">+ 新規追加</button>
    </div>

    <div v-if="sources.length === 0" class="empty-state">
      <p>請求元がまだ登録されていません</p>
      <button @click="goToCreate" class="btn-create-large">最初の請求元を追加する</button>
    </div>

    <div v-else class="source-table-container">
      <table class="source-table">
        <thead>
          <tr>
            <th>会社名・屋号</th>
            <th>住所</th>
            <th>電話番号</th>
            <th>メールアドレス</th>
            <th>インボイス登録番号</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="source in sources" :key="source.id" class="source-row">
            <td data-label="会社名・屋号" class="name">{{ source.name }}</td>
            <td data-label="住所">
              <div v-if="source.postalCode" class="postal">〒{{ source.postalCode }}</div>
              <div>{{ source.address || '-' }}</div>
            </td>
            <td data-label="電話番号">{{ source.phone || '-' }}</td>
            <td data-label="メールアドレス">{{ source.email || '-' }}</td>
            <td data-label="インボイス登録番号">{{ source.invoiceRegistrationNumber || '-' }}</td>
            <td data-label="操作" class="actions">
              <button @click="editSource(source.id)" class="btn-edit">編集</button>
              <button @click="deleteSource(source.id)" class="btn-delete">削除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import type { BillingSource } from '../types/invoice'

const router = useRouter()
const sources = ref<BillingSource[]>([])
let unsubscribe: (() => void) | null = null

onMounted(() => {
  const uid = auth.currentUser?.uid
  if (!uid) return

  const q = query(
    collection(db, 'invoiceBillingSources'),
    where('uid', '==', uid)
  )

  unsubscribe = onSnapshot(q, (snapshot) => {
    sources.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BillingSource))
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

const goToInvoices = () => router.push('/')
const goToCreate = () => router.push('/billing-sources/create')
const editSource = (id: string) => router.push(`/billing-sources/edit/${id}`)

const deleteSource = async (id: string) => {
  if (confirm('この請求元を削除してもよろしいですか？')) {
    await deleteDoc(doc(db, 'invoiceBillingSources', id))
  }
}
</script>

<style scoped>
.source-list {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.source-list * {
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

.source-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.source-table {
  width: 100%;
  border-collapse: collapse;
}

.source-table thead {
  background: #f8f9fa;
}

.source-table th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
}

.source-table tbody tr {
  border-bottom: 1px solid #e9ecef;
  transition: background 0.2s;
}

.source-table tbody tr:hover {
  background: #f8f9fa;
}

.source-table td {
  padding: 15px;
  color: #555;
}

.source-table td.name {
  font-weight: 600;
  color: #2c3e50;
}

.postal {
  font-size: 12px;
  color: #888;
}

.source-table td.actions {
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
  .source-list {
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

  .source-table-container {
    background: transparent;
    box-shadow: none;
    overflow-x: visible;
  }

  .source-table,
  .source-table tbody,
  .source-table tr,
  .source-table td {
    display: block;
    width: 100%;
  }

  .source-table thead {
    display: none;
  }

  .source-table tbody tr {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    margin-bottom: 12px;
    padding: 8px 12px;
  }

  .source-table tbody tr:hover {
    background: white;
  }

  .source-table td {
    padding: 10px 0;
    border-bottom: 1px solid #f1f3f5;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    text-align: right;
    word-break: break-word;
  }

  .source-table td:last-child {
    border-bottom: none;
  }

  .source-table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #2c3e50;
    text-align: left;
    flex-shrink: 0;
  }

  .source-table td.actions {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  .source-table td.actions::before {
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
  .source-list {
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
