<template>
  <div class="print-wrapper">
    <div class="screen-only print-controls">
      <button @click="window.print()" class="btn-print">印刷 / PDF出力</button>
      <button @click="goBack" class="btn-back">← 詳細に戻る</button>
    </div>

    <div class="invoice-page">
      <!-- ヘッダー右側：日付・請求書番号 -->
      <div class="invoice-meta">
        <div class="meta-row">{{ formatDate(invoice.invoiceDate) }}</div>
        <div class="meta-row">
          <span class="meta-label">請求No.</span>
          <span class="meta-value">{{ invoice.invoiceNumber }}</span>
        </div>
      </div>

      <!-- タイトル -->
      <h1 class="invoice-title">請求書</h1>

      <!-- 請求先・請求元の2カラム -->
      <div class="invoice-header-section">
        <!-- 左：請求先 -->
        <div class="billing-address-col">
          <div class="client-name">
            <span class="client-name-text">{{ clientName }}</span>
            <span class="client-sama">&nbsp;様</span>
          </div>

          <p class="invoice-greeting">下記のとおりご請求申し上げます。</p>

          <div class="total-box">
            <span class="total-label">合計：</span>
            <span class="total-amount">¥{{ invoice.total.toLocaleString() }}</span>
          </div>
        </div>

        <!-- 右：請求元 -->
        <div class="billing-source-col">
          <div v-if="source.postalCode" class="source-line">〒{{ source.postalCode }}</div>
          <div v-if="source.address" class="source-line">{{ source.address }}</div>
          <div v-if="source.name" class="source-line source-name">{{ source.name }}</div>
          <div v-if="source.phone" class="source-line">{{ source.phone }}</div>
          <div v-if="source.email" class="source-line">{{ source.email }}</div>
          <div v-if="source.invoiceRegistrationNumber" class="source-line">登録番号：{{ source.invoiceRegistrationNumber }}</div>
        </div>
      </div>

      <!-- 支払期限 -->
      <div class="due-date-row">
        <span class="due-label">お支払期限：</span>
        <span class="due-value">{{ formatDate(invoice.dueDate) }}</span>
      </div>

      <!-- 明細テーブル -->
      <table class="items-table">
        <thead>
          <tr>
            <th class="col-desc">品名</th>
            <th class="col-qty">数量</th>
            <th class="col-price">単価</th>
            <th class="col-amount">金額</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filledItems" :key="item.id">
            <td class="col-desc">{{ item.description }}</td>
            <td class="col-qty">{{ item.description ? `${item.quantity} ${item.unit}` : '' }}</td>
            <td class="col-price">{{ item.description ? `¥${item.unitPrice.toLocaleString()}` : '' }}</td>
            <td class="col-amount">{{ item.description ? `¥${item.amount.toLocaleString()}` : '' }}</td>
          </tr>
          <tr class="total-row">
            <td colspan="3" class="total-label-cell">合計</td>
            <td class="col-amount total-cell">¥{{ invoice.total.toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>

      <!-- 備考 -->
      <div v-if="invoice.notes" class="notes-section">
        <p class="notes-text">{{ invoice.notes }}</p>
      </div>

      <!-- 振込先 -->
      <div v-if="hasBankInfo" class="bank-box">
        <div class="bank-title">お振込先</div>
        <div v-if="source.bankName || source.bankBranch" class="bank-line">
          {{ source.bankName }}{{ source.bankBranch ? ` ${source.bankBranch}` : '' }}
        </div>
        <div v-if="source.bankAccountType || source.bankAccountNumber" class="bank-line">
          ({{ source.bankAccountType }}){{ source.bankAccountNumber }}
        </div>
        <div v-if="source.bankAccountHolder" class="bank-line">{{ source.bankAccountHolder }}</div>
        <div class="bank-note">※恐れ入りますが、お振込手数料はご負担頂きますようお願い申し上げます。</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { InvoiceData, BillingAddress, BillingSource } from '../types/invoice'

const route = useRoute()
const router = useRouter()
const invoiceId = computed(() => route.params.id as string)

const window = globalThis.window

const invoice = ref<InvoiceData>({
  invoiceNumber: '',
  invoiceDate: '',
  dueDate: '',
  clientName: '',
  clientAddress: '',
  clientPhone: '',
  companyName: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  items: [],
  subtotal: 0,
  taxRate: 10,
  tax: 0,
  total: 0,
  notes: ''
})

const billingAddress = ref<BillingAddress | null>(null)
const billingSource = ref<BillingSource | null>(null)

const clientName = computed(() => billingAddress.value?.name || invoice.value.clientName)

const source = computed(() => ({
  postalCode: billingSource.value?.postalCode || '',
  address: billingSource.value?.address || invoice.value.companyAddress,
  name: billingSource.value?.name || invoice.value.companyName,
  phone: billingSource.value?.phone || invoice.value.companyPhone,
  email: billingSource.value?.email || invoice.value.companyEmail,
  invoiceRegistrationNumber: billingSource.value?.invoiceRegistrationNumber || '',
  bankName: billingSource.value?.bankName || '',
  bankBranch: billingSource.value?.bankBranch || '',
  bankAccountType: billingSource.value?.bankAccountType || '',
  bankAccountNumber: billingSource.value?.bankAccountNumber || '',
  bankAccountHolder: billingSource.value?.bankAccountHolder || ''
}))

const hasBankInfo = computed(() =>
  !!(source.value.bankName || source.value.bankAccountNumber || source.value.bankAccountHolder)
)

const MIN_ROWS = 8
const filledItems = computed(() => {
  const items = invoice.value.items.filter(i => i.description)
  const blanks = Math.max(0, MIN_ROWS - items.length)
  return [
    ...items,
    ...Array.from({ length: blanks }, (_, i) => ({
      id: `blank-${i}`,
      description: '',
      quantity: 0,
      unit: '',
      unitPrice: 0,
      amount: 0
    }))
  ]
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

const loadData = () => {
  const stored = localStorage.getItem('invoices')
  if (!stored) return
  try {
    const invoices: (InvoiceData & { id: string })[] = JSON.parse(stored)
    const found = invoices.find(inv => inv.id === invoiceId.value)
    if (!found) return
    invoice.value = found

    const addresses: BillingAddress[] = JSON.parse(localStorage.getItem('billingAddresses') || '[]')
    billingAddress.value = addresses.find(a => a.id === found.billingAddressId) || null

    const sources: BillingSource[] = JSON.parse(localStorage.getItem('billingSources') || '[]')
    billingSource.value = sources.find(s => s.id === found.billingSourceId) || null
  } catch (e) {
    console.error('請求書データの読み込みに失敗しました:', e)
  }
}

const goBack = () => {
  router.push(`/view/${invoiceId.value}`)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.print-wrapper {
  font-family: 'Hiragino Kaku Gothic Pro', 'メイリオ', Meiryo, sans-serif;
  background: #f0f0f0;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.print-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  justify-content: flex-end;
}

.btn-print {
  padding: 10px 28px;
  background: #2980b9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
}

.btn-print:hover {
  background: #2471a3;
}

.btn-back {
  padding: 10px 20px;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-back:hover {
  background: #7f8c8d;
}

/* A4用紙エリア */
.invoice-page {
  background: white;
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 20mm 18mm;
  box-sizing: border-box;
  position: relative;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
}

/* メタ情報（右上） */
.invoice-meta {
  text-align: right;
  font-size: 11pt;
  margin-bottom: 8mm;
  line-height: 1.8;
}

.meta-row {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.meta-label {
  color: #333;
}

.meta-value {
  min-width: 80px;
}

/* タイトル */
.invoice-title {
  text-align: center;
  font-size: 26pt;
  font-weight: bold;
  margin: 0 0 10mm 0;
  letter-spacing: 0.2em;
}

/* 請求先・請求元 2カラム */
.invoice-header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8mm;
  gap: 16mm;
}

.billing-address-col {
  flex: 1;
}

.billing-source-col {
  flex: 0 0 auto;
  text-align: left;
  font-size: 10pt;
  line-height: 1.9;
}

/* 請求先名 */
.client-name {
  border-bottom: 1.5px solid #333;
  padding-bottom: 2px;
  margin-bottom: 6mm;
  font-size: 14pt;
  display: inline-flex;
  align-items: baseline;
  min-width: 60mm;
}

.client-name-text {
  font-size: 14pt;
}

.client-sama {
  font-size: 12pt;
}

.invoice-greeting {
  font-size: 10pt;
  margin: 0 0 5mm 0;
  color: #333;
}

/* 合計ボックス */
.total-box {
  display: inline-flex;
  align-items: baseline;
  border: 2px solid #333;
  border-radius: 2px;
  padding: 4px 12px;
  gap: 8px;
  margin-top: 2mm;
}

.total-label {
  font-size: 13pt;
  font-weight: bold;
}

.total-amount {
  font-size: 20pt;
  font-weight: bold;
}

/* 請求元情報 */
.source-line {
  font-size: 10pt;
}

.source-name {
  font-size: 11pt;
  font-weight: bold;
  margin-top: 1mm;
}

/* 支払期限 */
.due-date-row {
  border-bottom: 1.5px solid #333;
  border-top: 1.5px solid #333;
  padding: 3px 6px;
  font-size: 10pt;
  margin-bottom: 4mm;
  display: flex;
  gap: 8px;
}

.due-label {
  font-weight: 600;
}

/* 明細テーブル */
.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10pt;
  margin-bottom: 6mm;
}

.items-table thead tr {
  background: #444;
  color: white;
}

.items-table th {
  padding: 6px 10px;
  text-align: center;
  font-weight: 600;
}

.items-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #ddd;
  height: 9mm;
}

.items-table tbody tr:last-child td {
  border-bottom: none;
}

.col-desc {
  width: 50%;
  text-align: center;
}

.col-qty {
  width: 15%;
  text-align: center;
}

.col-price {
  width: 17%;
  text-align: right;
}

.col-amount {
  width: 18%;
  text-align: right;
}

.total-row {
  border-top: 1px solid #333;
}

.total-label-cell {
  text-align: center;
  font-weight: bold;
  background: #f5f5f5;
}

.total-cell {
  font-weight: bold;
}

/* 備考 */
.notes-section {
  margin-bottom: 6mm;
}

.notes-text {
  font-size: 10pt;
  margin: 0;
  white-space: pre-wrap;
}

/* 振込先ボックス */
.bank-box {
  border: 1px solid #555;
  padding: 8px 12px;
  font-size: 10pt;
  line-height: 1.9;
  margin-top: auto;
}

.bank-title {
  font-weight: 600;
  margin-bottom: 2px;
}

.bank-line {
  color: #222;
}

.bank-note {
  margin-top: 4px;
  font-size: 9pt;
  color: #444;
}

/* 印刷時のスタイル */
@media print {
  .screen-only {
    display: none !important;
  }

  .print-wrapper {
    background: white;
    padding: 0;
  }

  .invoice-page {
    box-shadow: none;
    margin: 0;
    padding: 15mm 18mm;
    width: 100%;
    min-height: auto;
  }

  @page {
    size: A4;
    margin: 0;
  }
}
</style>
