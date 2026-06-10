import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import type { ItemMaster } from '../types/invoice'

export default function ItemMasterList() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ItemMaster[]>([])

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const q = query(collection(db, 'itemMasters'), where('uid', '==', uid))
    const unsub = onSnapshot(q, snapshot => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ItemMaster)))
    })
    return unsub
  }, [])

  const sortedItems = useMemo(() =>
    [...items].sort((a, b) => {
      const aO = a.sortOrder ?? Infinity
      const bO = b.sortOrder ?? Infinity
      return aO !== bO ? aO - bO : a.description.localeCompare(b.description, 'ja')
    }), [items])

  const deleteItem = async (id: string) => {
    if (confirm('この品目を削除してもよろしいですか？')) {
      try {
        await deleteDoc(doc(db, 'itemMasters', id))
      } catch (e) {
        console.error(e)
        alert('削除中にエラーが発生しました。もう一度お試しください。')
      }
    }
  }

  return (
    <div className="item-list">
      <div className="list-header">
        <button onClick={() => navigate('/')} className="btn-back">← 請求書一覧</button>
        <h2>品目管理</h2>
        <button onClick={() => navigate('/items/create')} className="btn-create">+ 新規追加</button>
      </div>

      {sortedItems.length === 0 ? (
        <div className="empty-state">
          <p>品目がまだ登録されていません</p>
          <button onClick={() => navigate('/items/create')} className="btn-create-large">最初の品目を追加する</button>
        </div>
      ) : (
        <div className="item-table-container">
          <table className="item-table">
            <thead>
              <tr>
                <th>並び順</th>
                <th>品名</th>
                <th>単価</th>
                <th>単位</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map(item => (
                <tr key={item.id} className="item-row">
                  <td data-label="並び順" className="sort-order">{item.sortOrder ?? '-'}</td>
                  <td data-label="品名" className="name">{item.description}</td>
                  <td data-label="単価" className="price">￥{item.unitPrice.toLocaleString()}</td>
                  <td data-label="単位">{item.unit || '-'}</td>
                  <td data-label="操作" className="actions">
                    <button onClick={() => navigate(`/items/edit/${item.id}`)} className="btn-edit">編集</button>
                    <button onClick={() => deleteItem(item.id)} className="btn-delete">削除</button>
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
