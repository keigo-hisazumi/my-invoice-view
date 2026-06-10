import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import type { InvoiceData, BillingAddress, BillingSource } from '../types/invoice'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function InvoicePrint() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [isGenerating, setIsGenerating] = useState(false)
  const invoicePageRef = useRef<HTMLDivElement>(null)

  const [invoice, setInvoice] = useState<InvoiceData>({
    invoiceNumber: '', invoiceDate: '', dueDate: '',
    clientName: '', clientAddress: '', clientPhone: '',
    companyName: '', companyAddress: '', companyPhone: '', companyEmail: '',
    items: [], subtotal: 0, taxRate: 10, tax: 0, total: 0, notes: ''
  })
  const [billingAddress, setBillingAddress] = useState<BillingAddress | null>(null)
  const [billingSource, setBillingSource] = useState<BillingSource | null>(null)

  const clientName = billingAddress?.name ?? invoice.clientName
  const source = useMemo(() => ({
    postalCode: billingSource?.postalCode ?? '',
    address: billingSource?.address ?? invoice.companyAddress,
    name: billingSource?.name ?? invoice.companyName,
    phone: billingSource?.phone ?? invoice.companyPhone,
    email: billingSource?.email ?? invoice.companyEmail,
    invoiceRegistrationNumber: billingSource?.invoiceRegistrationNumber ?? '',
    bankName: billingSource?.bankName ?? '',
    bankBranch: billingSource?.bankBranch ?? '',
    bankAccountType: billingSource?.bankAccountType ?? '',
    bankAccountNumber: billingSource?.bankAccountNumber ?? '',
    bankAccountHolder: billingSource?.bankAccountHolder ?? ''
  }), [billingSource, invoice])

  const hasBankInfo = !!(source.bankName || source.bankAccountNumber || source.bankAccountHolder)

  const MIN_ROWS = 8
  const filledItems = useMemo(() => {
    const items = invoice.items.filter(i => i.description)
    const blanks = Math.max(0, MIN_ROWS - items.length)
    return [
      ...items,
      ...Array.from({ length: blanks }, (_, i) => ({
        id: `blank-${i}`, description: '', quantity: 0, unit: '', unitPrice: 0, amount: 0
      }))
    ]
  }, [invoice.items])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const invSnap = await getDoc(doc(db, 'invoices', id))
      if (!invSnap.exists()) return
      const data = invSnap.data()
      if (data['uid'] !== auth.currentUser?.uid) {
        alert('アクセス権限がありません')
        navigate('/')
        return
      }
      setInvoice({ ...data, id: invSnap.id } as InvoiceData)

      if (data['billingAddressId']) {
        const addrSnap = await getDoc(doc(db, 'billingAddresses', data['billingAddressId']))
        if (addrSnap.exists() && addrSnap.data()['uid'] === auth.currentUser?.uid) {
          setBillingAddress({ id: addrSnap.id, ...addrSnap.data() } as BillingAddress)
        }
      }
      if (data['billingSourceId']) {
        const srcSnap = await getDoc(doc(db, 'billingSources', data['billingSourceId']))
        if (srcSnap.exists() && srcSnap.data()['uid'] === auth.currentUser?.uid) {
          setBillingSource({ id: srcSnap.id, ...srcSnap.data() } as BillingSource)
        }
      }
    }
    load()
  }, [id, navigate])

  const downloadPdf = async () => {
    if (!invoicePageRef.current) return
    setIsGenerating(true)
    try {
      const canvas = await html2canvas(invoicePageRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
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
      pdf.save(`請求書_${invoice.invoiceNumber || id}.pdf`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="print-wrapper">
      <div className="print-controls">
        <button onClick={downloadPdf} disabled={isGenerating} className="btn-print">
          {isGenerating ? 'PDF生成中...' : 'PDFをダウンロード'}
        </button>
        <button onClick={() => navigate(`/view/${id}`)} className="btn-back">← 詳細に戻る</button>
      </div>

      <div ref={invoicePageRef} className="invoice-page">
        <div className="invoice-meta">
          <div className="meta-row">{formatDate(invoice.invoiceDate)}</div>
          <div className="meta-row">
            <span className="meta-label">請求No.</span>
            <span className="meta-value">{invoice.invoiceNumber}</span>
          </div>
        </div>

        <h1 className="invoice-title">請求書</h1>

        <div className="invoice-header-section">
          <div className="billing-address-col">
            <div className="client-name">
              <span className="client-name-text">{clientName}</span>
              <span className="client-sama">&nbsp;様</span>
            </div>
            <p className="invoice-greeting">下記のとおりご請求申し上げます。</p>
            <div className="total-box">
              <span className="total-label">合計：</span>
              <span className="total-amount">￥{invoice.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="billing-source-col">
            {source.postalCode && <div className="source-line">〒{source.postalCode}</div>}
            {source.address && <div className="source-line">{source.address}</div>}
            {source.name && <div className="source-line source-name">{source.name}</div>}
            {source.phone && <div className="source-line">{source.phone}</div>}
            {source.email && <div className="source-line">{source.email}</div>}
            {source.invoiceRegistrationNumber && <div className="source-line">登録番号：{source.invoiceRegistrationNumber}</div>}
          </div>
        </div>

        <div className="due-date-row">
          <span className="due-label">お支払期限：</span>
          <span className="due-value">{formatDate(invoice.dueDate)}</span>
        </div>

        <table className="items-table">
          <thead>
            <tr>
              <th className="col-desc">品名</th>
              <th className="col-qty">数量</th>
              <th className="col-price">単価</th>
              <th className="col-amount">金額</th>
            </tr>
          </thead>
          <tbody>
            {filledItems.map(item => (
              <tr key={item.id}>
                <td className="col-desc">{item.description}</td>
                <td className="col-qty">{item.description ? `${item.quantity} ${item.unit}` : ''}</td>
                <td className="col-price">{item.description ? `￥${item.unitPrice.toLocaleString()}` : ''}</td>
                <td className="col-amount">{item.description ? `￥${item.amount.toLocaleString()}` : ''}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan={3} className="total-label-cell">合計</td>
              <td className="col-amount total-cell">￥{invoice.total.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        {invoice.notes && (
          <div className="notes-section">
            <p className="notes-text">{invoice.notes}</p>
          </div>
        )}

        {hasBankInfo && (
          <div className="bank-box">
            <div className="bank-title">お振込先</div>
            {(source.bankName || source.bankBranch) && (
              <div className="bank-line">{source.bankName}{source.bankBranch ? ` ${source.bankBranch}` : ''}</div>
            )}
            {(source.bankAccountType || source.bankAccountNumber) && (
              <div className="bank-line">({source.bankAccountType}){source.bankAccountNumber}</div>
            )}
            {source.bankAccountHolder && <div className="bank-line">{source.bankAccountHolder}</div>}
            <div className="bank-note">※恐れ入りますが、お振込手数料はご負担頂きますようお願い申し上げます。</div>
          </div>
        )}
      </div>
    </div>
  )
}
