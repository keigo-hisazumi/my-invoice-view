// 請求書データの型定義

export interface InvoiceItem {
  id: string
  description: string  // 品名
  quantity: number     // 数量
  unitPrice: number    // 単価
  unit: string         // 単位
  amount: number       // 金額
}

// 明細プリセット
export interface ItemPreset {
  description: string
  unitPrice: number
  unit: string
}

export const ITEM_PRESETS: ItemPreset[] = [
  { description: 'リズム録音', unitPrice: 5000, unit: '時間' },
  { description: 'ドラム録音', unitPrice: 5000, unit: '時間' },
  { description: 'ダビング録音', unitPrice: 3500, unit: '時間' },
  { description: 'ボーカル録音', unitPrice: 3500, unit: '時間' },
  { description: 'Mix (Mastering込み)', unitPrice: 10000, unit: '曲' },
  { description: 'Mastering', unitPrice: 2000, unit: '曲' },
  { description: 'お試し録音', unitPrice: 2500, unit: '時間' },
  { description: '割引', unitPrice: -1000, unit: '' }
]

export interface InvoiceData {
  id?: string                    // ID（一覧表示用）
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
  
  // メタデータ
  createdAt?: string        // 作成日時
  updatedAt?: string        // 更新日時
}

// 請求書一覧表示用の簡易型
export interface InvoiceListItem {
  id: string
  invoiceNumber: string
  invoiceDate: string
  clientName: string
  total: number
  createdAt: string
}
