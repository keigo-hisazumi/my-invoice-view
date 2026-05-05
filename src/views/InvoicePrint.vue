<template>
  <div class="print-wrapper">
    <div class="print-controls">
      <button @click="downloadPdf" :disabled="isGenerating" class="btn-print">
        {{ isGenerating ? 'PDF生成中...' : 'PDFをダウンロード' }}
      </button>
      <button @click="goBack" class="btn-back">← 詳細に戻る</button>
    </div>

    <div ref="invoicePageRef" class="invoice-page">
      <div class="invoice-meta">
        <div class="meta-row">{{ formatDate(invoice.invoiceDate) }}</div>
        <div class="meta-row">
          <span class="meta-label">請求No.</span>
          <span class="meta-value">{{ invoice.invoiceNumber }}</span>
        </div>
      </div>

      <h1 class="invoice-title">請求書</h1>

      <div class="invoice-header-section">
        <div class="billing-address-col">
          <div class="client-name">
            <span class="client-name-text">{{ clientName }}</span>
            <span class="client-sama">&nbsp;様</span>
          </div>

          <p class="invoice-greeting">下記のとおりご請求申し上げます。</p>

          <div class="total-box">
            <span class="total-label">合計：</span>
            <span class="total-amount">￥{{ invoice.total.toLocaleString() }}</span>
          </div>
        </div>

        <div class="billing-source-col">
          <div v-if="source.postalCode" class="source-line">〒{{ source.postalCode }}</div>
          <div v-if="source.address" class="source-line">{{ source.address }}</div>
          <div v-if="source.name" class="source-line source-name">{{ source.name }}</div>
          <div v-if="source.phone" class="source-line">{{ source.phone }}</div>
          <div v-if="source.email" class="source-line">{{ source.email }}</div>
          <div v-if="source.invoiceRegistrationNumber" class="source-line">登録番号：{{ source.invoiceRegistrationNumber }}</div>
        </div>
      </div>

      <div class="due-date-row">
        <span class="due-label">お支払期限：</span>
        <span class="due-value">{{ formatDate(invoice.dueDate) }}</span>
      </div>

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
            <td class="col-price">{{ item.description ? `￥${item.unitPrice.toLocaleString()}` : '' }}</td>
            <td class="col-amount">{{ item.description ? `￥${item.amount.toLocaleString()}` : '' }}</td>
          </tr>
          <tr class="total-row">
            <td colspan="3" class="total-label-cell">合計</td>
            <td class="col-amount total-cell">￥{{ invoice.total.toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="invoice.notes" class="notes-section">
        <p class="notes-text">{{ invoice.notes }}</p>
      </div>

      <div v-if="hasBankInfo" class="bank-box">
        <div class="bank-title">お振込先</div>
        <div v-if="source.bankName || source.bankBranch" class="bank-line">
          {{ source.bankName }}{{ source.bankBranch ? ` ${source.bankBranch}` : '' }}
        </div>
        <div v-if="source.bankAccountType || source.bankAccountNumber" class="bank-line">
          ({{ source.bankAccountType }}){{ source.bankAccountNumber }}
        </div>
        <div v-if="source.bankAccountHolder" class="bank-line">{{ source.bankAccountHolder }}</div>
        <div class="bank-note">※恐れ入りますが、お振込手数料はご負担頭きますようお願い申し上げます。</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import type { InvoiceData, BillingAddress, BillingSource } from '../types/invoice'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const route = useRoute()
const router = useRouter()
const invoiceId = computed(() => route.params.id as string)
const isGenerating = ref(false)
const invoicePageRef = ref<HTMLElement | null>(null)

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

const loadData = async () => {
  const invSnap = await getDoc(doc(db, 'invoices', invoiceId.value))
  if (!invSnap.exists()) return
  const data = invSnap.data()
  if (data.uid !== auth.currentUser?.uid) {
    alert('アクセス権限がありません')
    router.push('/')
    return
  }
  invoice.value = { ...data, id: invSnap.id } as InvoiceData

  if (data.billingAddressId) {
    const addrSnap = await getDoc(doc(db, 'billingAddresses', data.billingAddressId))
    if (addrSnap.exists() && addrSnap.data().uid === auth.currentUser?.uid) {
      billingAddress.value = { id: addrSnap.id, ...addrSnap.data() } as BillingAddress
    }
  }

  if (data.billingSourceId) {
    const srcSnap = await getDoc(doc(db, 'billingSources', data.billingSourceId))
    if (srcSnap.exists() && srcSnap.data().uid === auth.currentUser?.uid) {
      billingSource.value = { id: srcSnap.id, ...srcSnap.data() } as BillingSource
    }
  }
}

const goBack = () => router.push(`/view/${invoiceId.value}`)

const downloadPdf = async () => {
  if (!invoicePageRef.value) return
  isGenerating.value = true
  try {
    const canvas = await html2canvas(invoicePageRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    })
    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const ratio = canvas.height / canvas.width
    const imgHeight = pageWidth * ratio
    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeight)
    } else {
      const scaledWidth = pageHeight / ratio
      pdf.addImage(imgData, 'JPEG', 0, 0, scaledWidth, pageHeight)
    }
    const fileName = `請求書_${invoice.value.invoiceNumber || invoiceId.value}.pdf`
    pdf.save(fileName)
  } finally {
    isGenerating.value = false
  }
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

.invoice-title {
  text-align: center;
  font-size: 26pt;
  font-weight: bold;
  margin: 0 0 10mm 0;
  letter-spacing: 0.2em;
}

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

.source-line {
  font-size: 10pt;
}

.source-name {
  font-size: 11pt;
  font-weight: bold;
  margin-top: 1mm;
}

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

.notes-section {
  margin-bottom: 6mm;
}

.notes-text {
  font-size: 10pt;
  margin: 0;
  white-space: pre-wrap;
}

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

.btn-print:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
