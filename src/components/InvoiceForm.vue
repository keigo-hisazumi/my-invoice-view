<template>
  <div class="invoice-form">
    <h2>請求書作成</h2>
    
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
        <span class="col-price">単価</span>
        <span class="col-amount">金額</span>
        <span class="col-actions"></span>
      </div>
      <div v-for="(item, index) in invoice.items" :key="item.id" class="item-row">
        <input 
          v-model="item.description" 
          type="text" 
          placeholder="商品名" 
          class="col-desc"
          @input="updateItem(index)"
        />
        <input 
          v-model.number="item.quantity" 
          type="number" 
          min="0" 
          step="1"
          class="col-qty"
          @input="updateItem(index)"
        />
        <input 
          v-model.number="item.unitPrice" 
          type="number" 
          min="0" 
          step="0.01"
          class="col-price"
          @input="updateItem(index)"
        />
        <span class="col-amount">¥{{ item.amount.toLocaleString() }}</span>
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
import { reactive } from 'vue'
import type { InvoiceData } from '../types/invoice'

// 請求書データの初期化
const invoice = reactive<InvoiceData>({
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().split('T')[0] || '',
  dueDate: '',
  clientName: '',
  clientAddress: '',
  clientPhone: '',
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
      amount: 0
    }
  ],
  subtotal: 0,
  taxRate: 10,
  tax: 0,
  total: 0,
  notes: ''
})

// 明細行を追加
const addItem = () => {
  invoice.items.push({
    id: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unitPrice: 0,
    amount: 0
  })
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

</script>

<style scoped>
.invoice-form {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
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

.items-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 100px;
  gap: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  font-weight: 600;
  margin-bottom: 10px;
}

.item-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 100px;
  gap: 10px;
  padding: 10px;
  margin-bottom: 10px;
  align-items: center;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 4px;
}

.item-row input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.col-desc { width: 100%; }
.col-qty { width: 100%; text-align: center; }
.col-price { width: 100%; text-align: right; }
.col-amount { 
  width: 100%; 
  text-align: right;
  font-weight: 600;
  padding-right: 10px;
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
  .items-header,
  .item-row {
    grid-template-columns: 1fr;
  }
  
  .col-amount {
    text-align: left;
  }
}
</style>
