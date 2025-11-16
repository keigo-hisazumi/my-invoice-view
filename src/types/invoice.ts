// 請求書データの型定義

export interface InvoiceItem {
  id: string
  description: string  // 品名
  quantity: number     // 数量
  unitPrice: number    // 単価
  amount: number       // 金額
}

export interface InvoiceData {
  invoiceNumber: string      // 請求書番号
  invoiceDate: string        // 請求日
  dueDate: string           // 支払期限
  
  // 請求先情報
  clientName: string        // お客様名
  clientAddress: string     // お客様住所
  clientPhone: string       // お客様電話番号
  
  // 請求元情報
  companyName: string       // 会社名
  companyAddress: string    // 会社住所
  companyPhone: string      // 会社電話番号
  companyEmail: string      // メールアドレス
  
  // 明細
  items: InvoiceItem[]
  
  // 金額
  subtotal: number          // 小計
  taxRate: number           // 消費税率
  tax: number               // 消費税額
  total: number             // 合計金額
  
  // 備考
  notes: string
}
