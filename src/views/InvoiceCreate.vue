<template>
  <div class="invoice-form">
    <div class="form-header">
      <button @click="goBack" class="btn-back">← 一覧に戻る</button>
      <h2>{{ pageTitle }}</h2>
      <div class="header-actions">
        <button v-if="isViewMode" @click="goToPrint" class="btn-pdf">PDF出力</button>
        <button v-if="isViewMode" @click="goToEdit" class="btn-edit-header">編集</button>
        <button v-if="!isViewMode" @click="saveInvoice" class="btn-save">保存</button>
      </div>
    </div>
    
    <div class="form-section">
      <h3>基本情報</h3>
      <div class="form-row">
        <div class="form-group">
          <label>請求書番号</label>
          <input v-model="invoice.invoiceNumber" type="text" placeholder="INV-001" :readonly="isViewMode" :class="{ 'readonly-field': isViewMode }" />
        </div>
        <div class="form-group">
          <label>請求日</label>
          <input v-model="invoice.invoiceDate" type="date" :readonly="isViewMode" :class="{ 'readonly-field': isViewMode }" />
        </div>
        <div class="form-group">
          <label>支払期限</label>
          <input v-model="invoice.dueDate" type="date" :readonly="isViewMode" :class="{ 'readonly-field': isViewMode }" />
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3>請求先情報</h3>
      <div class="form-group">
        <label>お客様名 <span v-if="!isViewMode" class="required">*</span></label>
        <select v-if="!isViewMode" @change="onBillingAddressChange" class="form-select" :value="invoice.billingAddressId">
          <option value="">-- 選択してください --</option>
          <option v-for="address in billingAddresses" :key="address.id" :value="address.id">
            {{ address.name }} {{ address.contactPerson ? `(${address.contactPerson})` : '' }}
          </option>
        </select>
        <input v-else :value="selectedBillingAddress?.name || invoice.clientName" type="text" readonly class="readonly-field" />
      </div>
      <div v-if="selectedBillingAddress" class="billing-info-display">
        <div class="info-row">
          <span class="label">会社名:</span>
          <span class="value">{{ selectedBillingAddress.name }}</span>
        </div>
        <div v-if="selectedBillingAddress.contactPerson" class="info-row">
          <span class="label">担当者:</span>
          <span class="value">{{ selectedBillingAddress.contactPerson }}</span>
        </div>
        <div class="info-row">
          <span class="label">住所:</span>
          <span class="value">{{ selectedBillingAddress.postalCode ? `〒${selectedBillingAddress.postalCode} ` : '' }}{{ selectedBillingAddress.address }}</span>
        </div>
        <div class="info-row">
          <span class="label">電話番号:</span>
          <span class="value">{{ selectedBillingAddress.phone }}</span>
        </div>
        <div v-if="selectedBillingAddress.email" class="info-row">
          <span class="label">メールアドレス:</span>
          <span class="value">{{ selectedBillingAddress.email }}</span>
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3>請求元情報</h3>
      <div class="form-group">
        <label>会社名 <span v-if="!isViewMode" class="required">*</span></label>
        <select v-if="!isViewMode" @change="onBillingSourceChange" class="form-select" :value="invoice.billingSourceId">
          <option value="">-- 選択してください --</option>
          <option v-for="source in billingSources" :key="source.id" :value="source.id">
            {{ source.name }}
          </option>
        </select>
        <input v-else :value="selectedBillingSource?.name || invoice.companyName" type="text" readonly class="readonly-field" />
      </div>
      <div v-if="selectedBillingSource" class="billing-info-display">
        <div class="info-row">
          <span class="label">会社名:</span>
          <span class="value">{{ selectedBillingSource.name }}</span>
        </div>
        <div class="info-row">
          <span class="label">住所:</span>
          <span class="value">{{ selectedBillingSource.postalCode ? `〒${selectedBillingSource.postalCode} ` : '' }}{{ selectedBillingSource.address }}</span>
        </div>
        <div class="info-row">
          <span class="label">電話番号:</span>
          <span class="value">{{ selectedBillingSource.phone }}</span>
        </div>
        <div class="info-row">
          <span class="label">メールアドレス:</span>
          <span class="value">{{ selectedBillingSource.email }}</span>
        </div>
        <div v-if="selectedBillingSource.invoiceRegistrationNumber" class="info-row">
          <span class="label">インボイス登録番号:</span>
          <span class="value">{{ selectedBillingSource.invoiceRegistrationNumber }}</span>
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3>明細</h3>
      <div class="items-header">
        <span class="col-desc">品名</span>
        <span class="col-qty">数量</span>
        <span class="col-unit">単位</span>
        <span class="col-price">単価</span>
        <span class="col-amount">金額</span>
        <span class="col-actions"></span>
      </div>
      <div v-for="(item, index) in invoice.items" :key="item.id" class="item-row">
        <div class="item-cell col-desc">
          <span class="item-label">品名</span>
          <select
            v-if="!isViewMode"
            :value="getItemMasterId(item.description)"
            @change="onPresetChange(index, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">選択してください</option>
            <option v-for="master in itemMasters" :key="master.id" :value="master.id">
              {{ master.description }}
            </option>
          </select>
          <span v-else class="readonly-value">{{ item.description || '-' }}</span>
        </div>
        <div class="item-cell col-qty">
          <span class="item-label">数量</span>
          <input
            v-if="!isViewMode"
            v-model.number="item.quantity"
            type="number"
            min="0"
            step="1"
            @input="updateItem(index)"
          />
          <span v-else class="readonly-value">{{ item.quantity }}</span>
        </div>
        <div class="item-cell col-unit">
          <span class="item-label">単位</span>
          <span class="unit-value">{{ item.unit || '-' }}</span>
        </div>
        <div class="item-cell col-price">
          <span class="item-label">単価</span>
          <input
            v-if="!isViewMode"
            v-model.number="item.unitPrice"
            type="number"
            step="1"
            @input="updateItem(index)"
          />
          <span v-else class="readonly-value">¥{{ item.unitPrice.toLocaleString() }}</span>
        </div>
        <div class="item-cell col-amount">
          <span class="item-label">金額</span>
          <span class="amount-value">¥{{ item.amount.toLocaleString() }}</span>
        </div>
        <button v-if="!isViewMode" @click="removeItem(index)" class="btn-remove col-actions">削除</button>
        <span v-else class="col-actions"></span>
      </div>
      <button v-if="!isViewMode" @click="addItem" class="btn-add">+ 明細を追加</button>
    </div>

    <div class="form-section">
      <h3>金額</h3>
      <div class="form-row">
        <div class="form-group">
          <label>消費税率 (%)</label>
          <input v-if="!isViewMode" v-model.number="invoice.taxRate" type="number" min="0" max="100" step="0.1" @input="calculateTotals" />
          <input v-else :value="invoice.taxRate" type="number" readonly class="readonly-field" />
        </div>
      </div>
      <div class="totals">
        <div class="total-row">
          <span>小計:</span>
          <span>¥{{ invoice.subtotal.toLocaleString() }}</span>
        </div>
        <div class="total-row">
          <span>消費税 ({{ invoice.taxRate }}%):</span>
          <span>¥{{ invoice.tax.toLocaleString() }}</span>
        </div>
        <div class="total-row total-final">
          <span>合計:</span>
          <span>¥{{ invoice.total.toLocaleString() }}</span>
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3>備考</h3>
      <div class="form-group">
        <textarea v-if="!isViewMode" v-model="invoice.notes" rows="4" placeholder="特記事項があればご記入ください"></textarea>
        <textarea v-else :value="invoice.notes" rows="4" readonly class="readonly-field"></textarea>
      </div>
    </div>

    <div v-if="!isViewMode" class="form-footer">
      <button @click="saveInvoice" class="btn-save btn-save-footer">保存</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { InvoiceData, BillingAddress, BillingSource, ItemMaster } from '../types/invoice'

const router = useRouter()
const route = useRoute()
const billingAddresses = ref<BillingAddress[]>([])
const billingSources = ref<BillingSource[]>([])
const itemMasters = ref<ItemMaster[]>([])

const isViewMode = computed(() => route.name === 'invoice-view')
const isEditMode = computed(() => route.name === 'invoice-edit')
const invoiceId = computed(() => route.params.id as string | undefined)

const pageTitle = computed(() => {
  if (isViewMode.value) return '請求書詳細'
  if (isEditMode.value) return '請求書編集'
  return '請求書作成'
})

// 請求書データの初期化
const oneMonthLater = new Date()
oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)

const invoice = reactive<InvoiceData>({
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().split('T')[0] || '',
  dueDate: oneMonthLater.toISOString().split('T')[0] || '',
  billingAddressId: undefined,
  clientName: '',
  clientAddress: '',
  clientPhone: '',
  billingSourceId: undefined,
  companyName: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  items: [
    {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      unit: '',
      amount: 0
    }
  ],
  subtotal: 0,
  taxRate: 10,
  tax: 0,
  total: 0,
  notes: ''
})

const loadBillingData = () => {
  const addressesStored = localStorage.getItem('billingAddresses')
  if (addressesStored) {
    try {
      billingAddresses.value = JSON.parse(addressesStored)
    } catch (e) {
      console.error('Failed to load billing addresses:', e)
      billingAddresses.value = []
    }
  }

  const sourcesStored = localStorage.getItem('billingSources')
  if (sourcesStored) {
    try {
      billingSources.value = JSON.parse(sourcesStored)
    } catch (e) {
      console.error('Failed to load billing sources:', e)
      billingSources.value = []
    }
  }

  const itemsStored = localStorage.getItem('itemMasters')
  if (itemsStored) {
    try {
      itemMasters.value = JSON.parse(itemsStored)
    } catch (e) {
      console.error('Failed to load item masters:', e)
      itemMasters.value = []
    }
  }
}

const selectedBillingAddress = computed(() => {
  return invoice.billingAddressId ? billingAddresses.value.find(a => a.id === invoice.billingAddressId) : null
})

const selectedBillingSource = computed(() => {
  return invoice.billingSourceId ? billingSources.value.find(s => s.id === invoice.billingSourceId) : null
})

const onBillingAddressChange = (e: Event) => {
  invoice.billingAddressId = (e.target as HTMLSelectElement).value
}

const onBillingSourceChange = (e: Event) => {
  invoice.billingSourceId = (e.target as HTMLSelectElement).value
}

// 明細行を追加
const addItem = () => {
  invoice.items.push({
    id: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unitPrice: 0,
    unit: '',
    amount: 0
  })
}

// 品名からマスタIDを逆引き（セレクトボックスのvalue設定用）
const getItemMasterId = (description: string): string => {
  const master = itemMasters.value.find(m => m.description === description)
  return master ? master.id : ''
}

// プリセット選択時の処理
const onPresetChange = (index: number, itemMasterId: string) => {
  const item = invoice.items[index]
  if (!item) return
  const master = itemMasters.value.find(m => m.id === itemMasterId)
  if (master) {
    item.description = master.description
    item.unitPrice = master.unitPrice
    item.unit = master.unit
  } else {
    item.description = ''
    item.unitPrice = 0
    item.unit = ''
  }
  updateItem(index)
}

// 明細行を削除
const removeItem = (index: number) => {
  if (invoice.items.length > 1) {
    invoice.items.splice(index, 1)
    calculateTotals()
  }
}

// 明細の金額を更新
const updateItem = (index: number) => {
  const item = invoice.items[index]
  if (item) {
    item.amount = item.quantity * item.unitPrice
    calculateTotals()
  }
}

// 合計金額を計算
const calculateTotals = () => {
  invoice.subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0)
  invoice.tax = Math.round(invoice.subtotal * invoice.taxRate / 100)
  invoice.total = invoice.subtotal + invoice.tax
}

// 初期計算
calculateTotals()

const loadInvoice = (id: string) => {
  const stored = localStorage.getItem('invoices')
  if (!stored) return
  try {
    const invoices: (InvoiceData & { id: string })[] = JSON.parse(stored)
    const found = invoices.find(inv => inv.id === id)
    if (!found) return
    Object.assign(invoice, found)
  } catch (e) {
    console.error('Failed to load invoice:', e)
  }
}

// マウント時に請求先・請求元データを読み込む
onMounted(() => {
  loadBillingData()
  if ((isViewMode.value || isEditMode.value) && invoiceId.value) {
    loadInvoice(invoiceId.value)
  }
})

// 一覧に戻る
const goBack = () => {
  router.push('/')
}

// 詳細から編集画面へ遷移
const goToEdit = () => {
  router.push(`/edit/${invoiceId.value}`)
}

// PDF出力画面へ遷移
const goToPrint = () => {
  router.push(`/print/${invoiceId.value}`)
}

// 保存
const saveInvoice = () => {
  // バリデーション
  if (!invoice.invoiceNumber) {
    alert('請求書番号を入力してください')
    return
  }
  if (!invoice.billingAddressId) {
    alert('請求先を選択してください')
    return
  }
  if (!invoice.billingSourceId) {
    alert('請求元を選択してください')
    return
  }

  const stored = localStorage.getItem('invoices')
  const invoices: (InvoiceData & { id: string })[] = stored ? JSON.parse(stored) : []

  if (isEditMode.value && invoiceId.value) {
    // 既存請求書を更新
    const idx = invoices.findIndex(inv => inv.id === invoiceId.value)
    if (idx !== -1) {
      invoices[idx] = { ...invoice, id: invoiceId.value, updatedAt: new Date().toISOString() }
    }
    localStorage.setItem('invoices', JSON.stringify(invoices))
    alert('請求書を更新しました')
  } else {
    // 新規作成
    const invoiceToSave = {
      ...invoice,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    invoices.push(invoiceToSave)
    localStorage.setItem('invoices', JSON.stringify(invoices))
    alert('請求書を保存しました')
  }

  router.push('/')
}

</script>

<style scoped>
.invoice-form {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.invoice-form * {
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

.btn-edit-header {
  padding: 10px 24px;
  background: #f39c12;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-edit-header:hover {
  background: #e67e22;
}

.btn-pdf {
  padding: 10px 24px;
  background: #2980b9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-pdf:hover {
  background: #2471a3;
}

.readonly-field {
  background: #f8f9fa !important;
  color: #555;
  cursor: default;
}

.readonly-value {
  display: block;
  padding: 8px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  color: #2c3e50;
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

h2 {
  color: #2c3e50;
  margin-bottom: 30px;
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

.form-group input,
.form-group textarea,
.form-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #3498db;
}

.form-select {
  background-color: white;
  cursor: pointer;
}

.required {
  color: #e74c3c;
  margin-left: 4px;
}

.billing-info-display {
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  margin-top: 10px;
}

.info-row {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  font-weight: 500;
  color: #555;
  min-width: 120px;
  flex-shrink: 0;
}

.info-row .value {
  color: #2c3e50;
  word-break: break-word;
}

.items-header {
  display: grid;
  grid-template-columns: 2fr 1fr 0.7fr 1fr 1fr 100px;
  gap: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  font-weight: 600;
  margin-bottom: 10px;
}

.item-row {
  display: grid;
  grid-template-columns: 2fr 1fr 0.7fr 1fr 1fr 100px;
  gap: 10px;
  padding: 10px;
  margin-bottom: 10px;
  align-items: center;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 4px;
}

.item-cell {
  min-width: 0;
}

.item-cell input,
.item-cell select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}

.item-label {
  display: none;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  margin-bottom: 4px;
}

.col-desc { min-width: 0; }
.col-qty { text-align: center; }
.col-qty input { text-align: center; }
.col-unit { text-align: center; color: #555; }
.col-unit .unit-value { display: block; }
.col-price { text-align: right; }
.col-price input { text-align: right; }
.col-amount {
  text-align: right;
  font-weight: 600;
  padding-right: 10px;
  min-width: 0;
  word-break: break-word;
}

.col-amount .amount-value {
  display: block;
}

.btn-remove {
  padding: 6px 12px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  width: 100%;
}

.btn-remove:hover {
  background: #c0392b;
}

.btn-add {
  margin-top: 10px;
  padding: 10px 20px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-add:hover {
  background: #229954;
}

.totals {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 4px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 16px;
}

.total-final {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  border-top: 2px solid #3498db;
  margin-top: 10px;
  padding-top: 15px;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  margin-bottom: 30px;
}

.btn-save-footer {
  padding: 14px 40px;
  font-size: 16px;
}

@media (max-width: 768px) {
  .invoice-form {
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

  .form-footer {
    justify-content: stretch;
  }

  .btn-save-footer {
    width: 100%;
  }

  .form-section {
    padding: 16px;
  }

  .form-group input,
  .form-group textarea,
  .item-cell input,
  .item-cell select {
    font-size: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .items-header {
    display: none;
  }

  .item-row {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 14px;
  }

  .item-label {
    display: block;
  }

  .col-qty,
  .col-unit,
  .col-price,
  .col-amount {
    text-align: left;
    padding-right: 0;
  }

  .col-qty input,
  .col-price input {
    text-align: left;
  }

  .btn-remove {
    margin-top: 4px;
    padding: 10px;
    font-size: 14px;
  }

  .btn-add {
    width: 100%;
  }

  .total-row {
    font-size: 15px;
  }

  .total-final {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .invoice-form {
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
