<template>
  <div class="invoice-list">
    <div class="list-header">
      <h2>請求書一覧</h2>
      <button @click="goToCreate" class="btn-create">+ 新規作成</button>
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
            <td>{{ invoice.invoiceNumber }}</td>
            <td>{{ formatDate(invoice.invoiceDate) }}</td>
            <td>{{ invoice.clientName }}</td>
            <td class="amount">¥{{ invoice.total.toLocaleString() }}</td>
            <td>{{ formatDateTime(invoice.createdAt) }}</td>
            <td class="actions">
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { InvoiceListItem } from '../types/invoice'

const router = useRouter()
const invoices = ref<InvoiceListItem[]>([])

// サンプルデータ（実際にはAPIから取得）
const loadInvoices = () => {
  // TODO: APIから請求書一覧を取得
  // 現在はローカルストレージからロード
  const stored = localStorage.getItem('invoices')
  if (stored) {
    try {
      const allInvoices = JSON.parse(stored)
      invoices.value = allInvoices.map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        clientName: inv.clientName,
        total: inv.total,
        createdAt: inv.createdAt
      }))
    } catch (e) {
      console.error('Failed to load invoices:', e)
    }
  }
}

// 新規作成画面へ遷移
const goToCreate = () => {
  router.push('/create')
}

// 詳細表示
const viewInvoice = (id: string) => {
  router.push(`/view/${id}`)
}

// 編集画面へ遷移
const editInvoice = (id: string) => {
  router.push(`/edit/${id}`)
}

// 削除
const deleteInvoice = (id: string) => {
  if (confirm('この請求書を削除してもよろしいですか？')) {
    const stored = localStorage.getItem('invoices')
    if (stored) {
      try {
        const allInvoices = JSON.parse(stored)
        const filtered = allInvoices.filter((inv: any) => inv.id !== id)
        localStorage.setItem('invoices', JSON.stringify(filtered))
        loadInvoices()
      } catch (e) {
        console.error('Failed to delete invoice:', e)
      }
    }
  }
}

// 日付フォーマット
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 日時フォーマット
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// マウント時に一覧をロード
onMounted(() => {
  loadInvoices()
})
</script>

<style scoped>
.invoice-list {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
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
  .list-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .invoice-table {
    font-size: 14px;
  }

  .invoice-table th,
  .invoice-table td {
    padding: 10px 8px;
  }

  .invoice-table td.actions {
    flex-direction: column;
  }
}
</style>
