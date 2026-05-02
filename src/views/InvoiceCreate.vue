<template>
  <div class="invoice-form">
    <div class="form-header">
      <button @click="goBack" class="btn-back">← 一覧に戻る</button>
      <h2>請求書作成</h2>
      <div class="header-actions">
        <button @click="saveInvoice" class="btn-save">保存</button>
      </div>
    </div>
    
    <div class="form-section">
      <h3>基本情報</h3>
      <div class="form-row">
        <div class="form-group">
          <label>請求書番号</label>
          <input v-model="invoice.invoiceNumber" type="text" placeholder="INV-001" />
        </div>
        <div class="form-group">
          <label>請求日</label>
          <input v-model="invoice.invoiceDate" type="date" />
        </div>
        <div class="form-group">
          <label>支払期限</label>
          <input v-model="invoice.dueDate" type="date" />
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3>請求先情報</h3>
      <div class="form-group">
        <label>登録済み請求先から選択</label>
        <select @change="onBillingAddressChange" class="form-select">
          <option value="">-- 登録済み請求先がない場合は手動入力してください --</option>
          <option v-for="address in billingAddresses" :key="address.id" :value="address.id">
            {{ address.name }} {{ address.contactPerson ? `(${address.contactPerson})` : '' }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>お客様名</label>
        <input v-model="invoice.clientName" type="text" placeholder="株式会社〇〇" />
      </div>
      <div class="form-group">
        <label>お客様住所</label>
        <input v-model="invoice.clientAddress" type="text" placeholder="東京都〇〇区..." />
      </div>
      <div class="form-group">
        <label>お客様電話番号</label>
        <input v-model="invoice.clientPhone" type="tel" placeholder="03-1234-5678" />
      </div>
    </div>

    <div class="form-section">
      <h3>請求元情報</h3>
      <div class="form-group">
        <label>登録済み請求元から選択</label>
        <select @change="onBillingSourceChange" class="form-select">
          <option value="">-- 登録済み請求元がない場合は手動入力してください --</option>
          <option v-for="source in billingSources" :key="source.id" :value="source.id">
            {{ source.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>会社名</label>
        <input v-model="invoice.companyName" type="text" placeholder="あなたの会社名" />
      </div>
      <div class="form-group">
        <label>会社住所</label>
        <input v-model="invoice.companyAddress" type="text" placeholder="東京都..." />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>会社電話番号</label>
          <input v-model="invoice.companyPhone" type="tel" placeholder="03-1234-5678" />
        </div>
        <div class="form-group">
          <label>メールアドレス</label>
          <input v-model="invoice.companyEmail" type="email" placeholder="info@example.com" />
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
            :value="item.description"
            @change="onPresetChange(index, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">選択してください</option>
            <option v-for="preset in ITEM_PRESETS" :key="preset.description" :value="preset.description">
              {{ preset.description }}
            </option>
          </select>
        </div>
        <div class="item-cell col-qty">
          <span class="item-label">数量</span>
          <input
            v-model.number="item.quantity"
            type="number"
            min="0"
            step="1"
            @input="updateItem(index)"
          />
        </div>
        <div class="item-cell col-unit">
          <span class="item-label">単位</span>
          <span class="unit-value">{{ item.unit || '-' }}</span>
        </div>
        <div class="item-cell col-price">
          <span class="item-label">単価</span>
          <input
            v-model.number="item.unitPrice"
            type="number"
            step="1"
            @input="updateItem(index)"
          />
        </div>
        <div class="item-cell col-amount">
          <span class="item-label">金額</span>
          <span class="amount-value">¥{{ item.amount.toLocaleString() }}</span>
        </div>
        <button @click="removeItem(index)" class="btn-remove col-actions">削除</button>
      </div>
      <button @click="addItem" class="btn-add">+ 明細を追加</button>
    </div>

    <div class="form-section">
      <h3>金額</h3>
      <div class="form-row">
        <div class="form-group">
          <label>消費税率 (%)</label>
          <input v-model.number="invoice.taxRate" type="number" min="0" max="100" step="0.1" @input="calculateTotals" />
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
        <textarea v-model="invoice.notes" rows="4" placeholder="特記事項があればご記入ください"></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { InvoiceData, BillingAddress, BillingSource } from '../types/invoice'
import { ITEM_PRESETS } from '../types/invoice'

const router = useRouter()
const billingAddresses = ref<BillingAddress[]>([])
const billingSources = ref<BillingSource[]>([])

// 請求書データの初期化
const invoice = reactive<InvoiceData>({
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().split('T')[0] || '',
  dueDate: '',
  billingAddressId: '',
  clientName: '',
  clientAddress: '',
  clientPhone: '',
  billingSourceId: '',
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
}

const onBillingAddressChange = (e: Event) => {
  const addressId = (e.target as HTMLSelectElement).value
  if (addressId) {
    invoice.billingAddressId = addressId
    const address = billingAddresses.value.find(a => a.id === addressId)
    if (address) {
      invoice.clientName = address.name
      invoice.clientAddress = address.postalCode ? `〒${address.postalCode} ${address.address}` : address.address
      invoice.clientPhone = address.phone
    }
  }
}

const onBillingSourceChange = (e: Event) => {
  const sourceId = (e.target as HTMLSelectElement).value
  if (sourceId) {
    invoice.billingSourceId = sourceId
    const source = billingSources.value.find(s => s.id === sourceId)
    if (source) {
      invoice.companyName = source.name
      invoice.companyAddress = source.postalCode ? `〒${source.postalCode} ${source.address}` : source.address
      invoice.companyPhone = source.phone
      invoice.companyEmail = source.email
    }
  }
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

// プリセット選択時の処理
const onPresetChange = (index: number, description: string) => {
  const item = invoice.items[index]
  if (!item) return
  const preset = ITEM_PRESETS.find(p => p.description === description)
  if (preset) {
    item.description = preset.description
    item.unitPrice = preset.unitPrice
    item.unit = preset.unit
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

// マウント時に請求先・請求元データを読み込む
onMounted(() => {
  loadBillingData()
})

// 一覧に戻る
const goBack = () => {
  router.push('/')
}

// 保存
const saveInvoice = () => {
  // バリデーション
  if (!invoice.invoiceNumber) {
    alert('請求書番号を入力してください')
    return
  }
  if (!invoice.clientName) {
    alert('お客様名を入力してください')
    return
  }

  // IDと作成日時を追加
  const invoiceToSave = {
    ...invoice,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  // ローカルストレージに保存
  const stored = localStorage.getItem('invoices')
  const invoices = stored ? JSON.parse(stored) : []
  invoices.push(invoiceToSave)
  localStorage.setItem('invoices', JSON.stringify(invoices))

  alert('請求書を保存しました')
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
