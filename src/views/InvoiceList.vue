<template>
  <div class="invoice-list">
    <div class="list-header">
      <h2>請求書一覧</h2>
      <div class="header-actions">
        <button @click="goToBillingSources" class="btn-secondary">請求元管理</button>
        <button @click="goToBillingAddresses" class="btn-secondary">請求先管理</button>
        <button @click="goToItems" class="btn-secondary">品目管理</button>
        <button @click="goToCreate" class="btn-create">+ 新規作成</button>
      </div>
    </div>

    <div v-if="invoices.length === 0" class="empty-state">
      <p>請求書がまだありません</p>
      <button @click="goToCreate" class="btn-create-large">最初の請求書を作成する</button>
    </div>

    <div v-else class="invoice-table-container">
      <table class="invoice-table">
        <thead>
          <tr>
            <th>請求書番号</th>
            <th>請求日</th>
            <th>顧客名</th>
            <th>合計金額</th>
            <th>作成日</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="invoice in invoices" :key="invoice.id" class="invoice-row">
            <td data-label="請求書番号">{{ invoice.invoiceNumber }}</td>
            <td data-label="請求日">{{ formatDate(invoice.invoiceDate) }}</td>
            <td data-label="顧客名">{{ invoice.clientName }}</td>
            <td data-label="合計金額" class="amount">￥{{ invoice.total.toLocaleString() }}</td>
            <td data-label="作成日">{{ formatDateTime(invoice.createdAt) }}</td>
            <td data-label="操作" class="actions">
              <button @click="viewInvoice(invoice.id)" class="btn-view">詳細</button>
              <button @click="editInvoice(invoice.id)" class="btn-edit">編集</button>
              <button @click="deleteInvoice(invoice.id)" class="btn-delete">削除</button>
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
import type { InvoiceListItem } from '../types/invoice'

const router = useRouter()
const invoices = ref<InvoiceListItem[]>([])
let unsubscribe: (() => void) | null = null

onMounted(() => {
  const uid = auth.currentUser?.uid
  if (!uid) return

  const q = query(
    collection(db, 'invoiceInvoices'),
    where('uid', '==', uid)
  )

  unsubscribe = onSnapshot(q, (snapshot) => {
    invoices.value = snapshot.docs
      .map(d => {
        const data = d.data()
        return {
          id: d.id,
          invoiceNumber: data.invoiceNumber,
          invoiceDate: data.invoiceDate,
          clientName: data.clientName,
          total: data.total,
          createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? ''
        } as InvoiceListItem
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

const goToCreate = () => router.push('/create')
const goToBillingSources = () => router.push('/billing-sources')
const goToBillingAddresses = () => router.push('/billing-addresses')
const goToItems = () => router.push('/items')
const viewInvoice = (id: string) => router.push(`/view/${id}`)
const editInvoice = (id: string) => router.push(`/edit/${id}`)

const deleteInvoice = async (id: string) => {
  if (confirm('この請求書を削除してもよろしいですか？')) {
    await deleteDoc(doc(db, 'invoiceInvoices', id))
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<style scoped>
.invoice-list {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.invoice-list * {
  box-sizing: border-box;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.list-header h2 {
  color: #2c3e50;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
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

.btn-secondary {
  padding: 12px 24px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-secondary:hover {
  background: #2980b9;
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

.invoice-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
}

.invoice-table thead {
  background: #f8f9fa;
}

.invoice-table th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
}

.invoice-table tbody tr {
  border-bottom: 1px solid #e9ecef;
  transition: background 0.2s;
}

.invoice-table tbody tr:hover {
  background: #f8f9fa;
}

.invoice-table td {
  padding: 15px;
  color: #555;
}

.invoice-table td.amount {
  font-weight: 600;
  color: #2c3e50;
}

.invoice-table td.actions {
  display: flex;
  gap: 8px;
}

.btn-view,
.btn-edit,
.btn-delete {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;
}

.btn-view {
  background: #3498db;
  color: white;
}

.btn-view:hover {
  opacity: 0.8;
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
  .invoice-list {
    padding: 12px;
  }

  .list-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
    margin-bottom: 20px;
  }

  .header-actions {
    flex-direction: column;
    gap: 10px;
  }

  .btn-create,
  .btn-secondary {
    width: 100%;
  }

  .invoice-table-container {
    background: transparent;
    box-shadow: none;
    overflow-x: visible;
  }

  .invoice-table,
  .invoice-table tbody,
  .invoice-table tr,
  .invoice-table td {
    display: block;
    width: 100%;
  }

  .invoice-table thead {
    display: none;
  }

  .invoice-table tbody tr {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    margin-bottom: 12px;
    padding: 8px 12px;
  }

  .invoice-table tbody tr:hover {
    background: white;
  }

  .invoice-table td {
    padding: 10px 0;
    border-bottom: 1px solid #f1f3f5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    text-align: right;
    word-break: break-word;
  }

  .invoice-table td:last-child {
    border-bottom: none;
  }

  .invoice-table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #2c3e50;
    text-align: left;
    flex-shrink: 0;
  }

  .invoice-table td.actions {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  .invoice-table td.actions::before {
    width: 100%;
    margin-bottom: 4px;
  }

  .btn-view,
  .btn-edit,
  .btn-delete {
    flex: 1;
    min-width: 72px;
    padding: 10px 12px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .invoice-list {
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
