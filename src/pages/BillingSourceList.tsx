import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import type { BillingSource } from '../types/invoice'

export default function BillingSourceList() {
  const navigate = useNavigate()
  const [sources, setSources] = useState<BillingSource[]>([])

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const q = query(collection(db, 'billingSources'), where('uid', '==', uid))
    const unsub = onSnapshot(q, snapshot => {
      setSources(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BillingSource)))
    })
    return unsub
  }, [])

  const deleteSource = async (id: string) => {
    if (confirm('この請求元を削除してもよろしいですか？')) {
      try {
        await deleteDoc(doc(db, 'billingSources', id))
      } catch (e) {
        console.error(e)
        alert('削除中にエラーが発生しました。もう一度お試しください。')
      }
    }
  }

  return (
    <div className="source-list">
      <div className="list-header">
        <button onClick={() => navigate('/')} className="btn-back">← 請求書一覧</button>
        <h2>請求元一覧</h2>
        <button onClick={() => navigate('/billing-sources/create')} className="btn-create">+ 新規追加</button>
      </div>

      {sources.length === 0 ? (
        <div className="empty-state">
          <p>請求元がまだ登録されていません</p>
          <button onClick={() => navigate('/billing-sources/create')} className="btn-create-large">最初の請求元を追加する</button>
        </div>
      ) : (
        <div className="source-table-container">
          <table className="source-table">
            <thead>
              <tr>
                <th>会社名・屋号</th>
                <th>住所</th>
                <th>電話番号</th>
                <th>メールアドレス</th>
                <th>インボイス登録番号</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sources.map(src => (
                <tr key={src.id} className="source-row">
                  <td data-label="会社名・屋号" className="name">{src.name}</td>
                  <td data-label="住所">
                    {src.postalCode && <div className="postal">〒{src.postalCode}</div>}
                    <div>{src.address || '-'}</div>
                  </td>
                  <td data-label="電話番号">{src.phone || '-'}</td>
                  <td data-label="メールアドレス">{src.email || '-'}</td>
                  <td data-label="インボイス登録番号">{src.invoiceRegistrationNumber || '-'}</td>
                  <td data-label="操作" className="actions">
                    <button onClick={() => navigate(`/billing-sources/edit/${src.id}`)} className="btn-edit">編集</button>
                    <button onClick={() => deleteSource(src.id)} className="btn-delete">削除</button>
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
