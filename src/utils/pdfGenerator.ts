import jsPDF from 'jspdf'
import type { InvoiceData } from '../types/invoice'

export function generateInvoicePDF(invoice: InvoiceData) {
  const doc = new jsPDF()
  
  // フォント設定（日本語対応のため、後でフォントを埋め込む必要がある場合があります）
  // 現在は基本的な英数字とカタカナのみサポート
  
  let yPosition = 20
  
  // タイトル
  doc.setFontSize(20)
  doc.text('請求書', 105, yPosition, { align: 'center' })
  yPosition += 15
  
  // 請求書番号と日付
  doc.setFontSize(10)
  doc.text(`請求書番号: ${invoice.invoiceNumber}`, 20, yPosition)
  yPosition += 7
  doc.text(`請求日: ${invoice.invoiceDate}`, 20, yPosition)
  yPosition += 7
  doc.text(`支払期限: ${invoice.dueDate}`, 20, yPosition)
  yPosition += 15
  
  // 請求先情報
  doc.setFontSize(12)
  doc.text('請求先', 20, yPosition)
  yPosition += 7
  doc.setFontSize(10)
  doc.text(invoice.clientName, 25, yPosition)
  yPosition += 5
  doc.text(invoice.clientAddress, 25, yPosition)
  yPosition += 5
  doc.text(`TEL: ${invoice.clientPhone}`, 25, yPosition)
  yPosition += 15
  
  // 請求元情報（右側）
  const rightX = 120
  let rightY = 50
  doc.setFontSize(10)
  doc.text(invoice.companyName, rightX, rightY, { align: 'left' })
  rightY += 5
  doc.text(invoice.companyAddress, rightX, rightY, { align: 'left' })
  rightY += 5
  doc.text(`TEL: ${invoice.companyPhone}`, rightX, rightY, { align: 'left' })
  rightY += 5
  doc.text(`Email: ${invoice.companyEmail}`, rightX, rightY, { align: 'left' })
  
  // 明細表のヘッダー
  yPosition += 5
  doc.setFillColor(240, 240, 240)
  doc.rect(20, yPosition - 5, 170, 8, 'F')
  doc.setFontSize(10)
  doc.text('品名', 25, yPosition)
  doc.text('数量', 100, yPosition, { align: 'right' })
  doc.text('単価', 130, yPosition, { align: 'right' })
  doc.text('金額', 180, yPosition, { align: 'right' })
  yPosition += 10
  
  // 明細行
  doc.setFontSize(9)
  invoice.items.forEach(item => {
    // ページの終わりに近い場合は新しいページを追加
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
    
    doc.text(item.description, 25, yPosition)
    doc.text(item.quantity.toString(), 100, yPosition, { align: 'right' })
    doc.text(`¥${item.unitPrice.toLocaleString()}`, 130, yPosition, { align: 'right' })
    doc.text(`¥${item.amount.toLocaleString()}`, 180, yPosition, { align: 'right' })
    yPosition += 7
  })
  
  // 区切り線
  yPosition += 5
  doc.line(20, yPosition, 190, yPosition)
  yPosition += 10
  
  // 合計
  doc.setFontSize(10)
  doc.text('小計:', 130, yPosition)
  doc.text(`¥${invoice.subtotal.toLocaleString()}`, 180, yPosition, { align: 'right' })
  yPosition += 7
  
  doc.text(`消費税 (${invoice.taxRate}%):`, 130, yPosition)
  doc.text(`¥${invoice.tax.toLocaleString()}`, 180, yPosition, { align: 'right' })
  yPosition += 7
  
  doc.setFontSize(12)
  doc.text('合計:', 130, yPosition)
  doc.text(`¥${invoice.total.toLocaleString()}`, 180, yPosition, { align: 'right' })
  yPosition += 15
  
  // 備考
  if (invoice.notes) {
    doc.setFontSize(10)
    doc.text('備考:', 20, yPosition)
    yPosition += 7
    
    // 備考を複数行に分割
    const lines = doc.splitTextToSize(invoice.notes, 170)
    doc.text(lines, 25, yPosition)
  }
  
  // PDFを保存
  doc.save(`invoice_${invoice.invoiceNumber || 'draft'}_${invoice.invoiceDate}.pdf`)
}
