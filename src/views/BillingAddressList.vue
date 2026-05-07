<template>
  <div class="address-list">
    <div class="list-header">
      <button @click="goToInvoices" class="btn-back">← 請求書一覧</button>
      <h2>請求先一覧</h2>
      <button @click="goToCreate" class="btn-create">+ 新規追加</button>
    </div>

    <div v-if="addresses.length === 0" class="empty-state">
      <p>請求先がまだ登録されていません</p>
      <button @click="goToCreate" class="btn-create-large">最初の請求先を追加する</button>
    </div>

    <div v-else class="address-table-container">
      <table class="address-table">
        <thead>
          <tr>
            <th>顧客コード</th>
            <th>請求先名</th>
            <th>担当者</th>
            <th>住所</th>
            <th>電話番号</th>
            <th>メールアドレス</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="address in addresses" :key="address.id" class="address-row">
            <td data-label="顧客コード" class="customer-code">{{ address.customerCode || '-' }}</td>
            <td data-label="請求先名" class="name">{{ address.name }}</td>
            <td data-label="担当者">{{ address.contactPerson || '-' }}</td>
            <td data-label="住所">
              <div v-if="address.postalCode" class="postal">〒{{ address.postalCode }}</div>
              <div>{{ address.address || '-' }}</div>
            </td>
            <td data-label="電話番号">{{ address.phone || '-' }}</td>
            <td data-label="メールアドレス">{{ address.email || '-' }}</td>
            <td data-label="操作" class="actions">
              <button @click="editAddress(address.id)" class="btn-edit">編集</button>
              <button @click="deleteAddress(address.id)" class="btn-delete">削除</button>
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
import { authReady } from '../router'
import type { BillingAddress } from '../types/invoice'

const router = useRouter()
const addresses = ref<BillingAddress[]>([])
let unsubscribe: (() => void) | null = null

onMounted(async () => {
  await authReady
  const uid = auth.currentUser?.uid
  if (!uid) return

  const q = query(
    collection(db, 'billingAddresses'),
    where('uid', '==', uid)
  )

  unsubscribe = onSnapshot(q, (snapshot) => {
    addresses.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BillingAddress))
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

const goToInvoices = () => router.push('/')
const goToCreate = () => router.push('/billing-addresses/create')
const editAddress = (id: string) => router.push(`/billing-addresses/edit/${id}`)

const deleteAddress = async (id: string) => {
  if (confirm('この請求先を削除してもよろしいですか？')) {
    try {
      await deleteDoc(doc(db, 'billingAddresses', id))
    } catch (e) {
      console.error(e)
      alert('削除中にエラーが発生しました。もう一度お試しください。')
    }
  }
}
</script>

<style scoped>
.address-list {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.address-list * {
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

.address-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.address-table {
  width: 100%;
  border-collapse: collapse;
}

.address-table thead {
  background: #f8f9fa;
}

.address-table th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
}

.address-table tbody tr {
  border-bottom: 1px solid #e9ecef;
  transition: background 0.2s;
}

.address-table tbody tr:hover {
  background: #f8f9fa;
}

.address-table td {
  padding: 15px;
  color: #555;
}

.address-table td.customer-code {
  font-family: monospace;
  font-size: 13px;
  color: #2980b9;
  white-space: nowrap;
}

.address-table td.name {
  font-weight: 600;
  color: #2c3e50;
}

.postal {
  font-size: 12px;
  color: #888;
}

.address-table td.actions {
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
  .address-list {
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

  .address-table-container {
    background: transparent;
    box-shadow: none;
    overflow-x: visible;
  }

  .address-table,
  .address-table tbody,
  .address-table tr,
  .address-table td {
    display: block;
    width: 100%;
  }

  .address-table thead {
    display: none;
  }

  .address-table tbody tr {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    margin-bottom: 12px;
    padding: 8px 12px;
  }

  .address-table tbody tr:hover {
    background: white;
  }

  .address-table td {
    padding: 10px 0;
    border-bottom: 1px solid #f1f3f5;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    text-align: right;
    word-break: break-word;
  }

  .address-table td:last-child {
    border-bottom: none;
  }

  .address-table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #2c3e50;
    text-align: left;
    flex-shrink: 0;
  }

  .address-table td.actions {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  .address-table td.actions::before {
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
  .address-list {
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
