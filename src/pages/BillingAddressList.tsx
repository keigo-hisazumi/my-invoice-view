import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import type { BillingAddress } from '../types/invoice'

export default function BillingAddressList() {
  const navigate = useNavigate()
  const [addresses, setAddresses] = useState<BillingAddress[]>([])

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const q = query(collection(db, 'billingAddresses'), where('uid', '==', uid))
    const unsub = onSnapshot(q, snapshot => {
      setAddresses(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BillingAddress)))
    })
    return unsub
  }, [])

  const deleteAddress = async (id: string) => {
    if (confirm('この請求先を削除してもよろしいですか？')) {
      try {
        await deleteDoc(doc(db, 'billingAddresses', id))
      } catch (e) {
        console.error(e)
        alert('削除中にエラーが発生しました。もう一度お試しください。')
      }
    }
  }

  return (
    <div className="address-list">
      <div className="list-header">
        <button onClick={() => navigate('/')} className="btn-back">← 請求書一覧</button>
        <h2>請求先一覧</h2>
        <button onClick={() => navigate('/billing-addresses/create')} className="btn-create">+ 新規追加</button>
      </div>

      {addresses.length === 0 ? (
        <div className="empty-state">
          <p>請求先がまだ登録されていません</p>
          <button onClick={() => navigate('/billing-addresses/create')} className="btn-create-large">最初の請求先を追加する</button>
        </div>
      ) : (
        <div className="address-table-container">
          <table className="address-table">
            <thead>
              <tr>
                <th>顧客コード</th>
                <th>請求先名</th>
                <th>担当者</th>
                <th>住所</th>
                <th>電話番号</th>
                <th>メールアドレス</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {addresses.map(addr => (
                <tr key={addr.id} className="address-row">
                  <td data-label="顧客コード" className="customer-code">{addr.customerCode || '-'}</td>
                  <td data-label="請求先名" className="name">{addr.name}</td>
                  <td data-label="担当者">{addr.contactPerson || '-'}</td>
                  <td data-label="住所">
                    {addr.postalCode && <div className="postal">〒{addr.postalCode}</div>}
                    <div>{addr.address || '-'}</div>
                  </td>
                  <td data-label="電話番号">{addr.phone || '-'}</td>
                  <td data-label="メールアドレス">{addr.email || '-'}</td>
                  <td data-label="操作" className="actions">
                    <button onClick={() => navigate(`/billing-addresses/edit/${addr.id}`)} className="btn-edit">編集</button>
                    <button onClick={() => deleteAddress(addr.id)} className="btn-delete">削除</button>
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
