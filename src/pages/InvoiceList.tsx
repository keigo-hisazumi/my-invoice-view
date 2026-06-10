import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import type { InvoiceListItem } from '../types/invoice'

export default function InvoiceList() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    const q = query(collection(db, 'invoices'), where('uid', '==', uid))
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(d => {
          const data = d.data()
          return {
            id: d.id,
            invoiceNumber: data.invoiceNumber,
            invoiceDate: data.invoiceDate,
            clientName: data.clientName,
            total: data.total,
            createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? ''
          } as InvoiceListItem
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setInvoices(list)
    })
    return unsub
  }, [])

  const deleteInvoice = async (id: string) => {
    if (confirm('この請求書を削除してもよろしいですか？')) {
      try {
        await deleteDoc(doc(db, 'invoices', id))
      } catch (e) {
        console.error(e)
        alert('削除中にエラーが発生しました。もう一度お試しください。')
      }
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  return (
    <div className="invoice-list">
      <div className="list-header">
        <h2>請求書一覧</h2>
        <div className="header-actions">
          <button onClick={() => navigate('/create')} className="btn-create">+ 新規作成</button>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="empty-state">
          <p>請求書がまだありません</p>
          <button onClick={() => navigate('/create')} className="btn-create-large">最初の請求書を作成する</button>
        </div>
      ) : (
        <div className="invoice-table-container">
          <table className="invoice-table">
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
              {invoices.map(invoice => (
                <tr key={invoice.id} className="invoice-row">
                  <td data-label="請求書番号">{invoice.invoiceNumber}</td>
                  <td data-label="請求日">{formatDate(invoice.invoiceDate)}</td>
                  <td data-label="顧客名">{invoice.clientName}</td>
                  <td data-label="合計金額" className="amount">￥{invoice.total.toLocaleString()}</td>
                  <td data-label="作成日">{formatDate(invoice.createdAt)}</td>
                  <td data-label="操作" className="actions">
                    <button onClick={() => navigate(`/view/${invoice.id}`)} className="btn-view">詳細</button>
                    <button onClick={() => navigate(`/edit/${invoice.id}`)} className="btn-edit">編集</button>
                    <button onClick={() => deleteInvoice(invoice.id)} className="btn-delete">削除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
