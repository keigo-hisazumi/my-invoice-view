import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { useToast } from '../contexts/ToastContext'

interface FormData {
  description: string
  unitPrice: number
  unit: string
  sortOrder: number | undefined
}

export default function ItemMasterForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const { show: showToast } = useToast()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>({ description: '', unitPrice: 0, unit: '', sortOrder: undefined })

  useEffect(() => {
    if (!isEdit || !id) return
    const load = async () => {
      const docSnap = await getDoc(doc(db, 'itemMasters', id))
      if (!docSnap.exists()) {
        alert('指定された品目が見つかりません')
        navigate('/items')
        return
      }
      const data = docSnap.data()
      if (data['uid'] !== auth.currentUser?.uid) {
        alert('アクセス権限がありません')
        navigate('/items')
        return
      }
      setForm({
        description: data['description'] ?? '',
        unitPrice: data['unitPrice'] ?? 0,
        unit: data['unit'] ?? '',
        sortOrder: data['sortOrder'] ?? undefined
      })
    }
    load()
  }, [id, isEdit, navigate])

  const handleSave = async () => {
    if (!form.description.trim()) {
      showToast('品名を入力してください', 'error')
      return
    }
    const uid = auth.currentUser?.uid
    if (!uid) return
    try {
      if (isEdit && id) {
        await updateDoc(doc(db, 'itemMasters', id), { ...form, updatedAt: serverTimestamp() })
        showToast('品目を更新しました')
      } else {
        await addDoc(collection(db, 'itemMasters'), { ...form, uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
        showToast('品目を追加しました')
      }
      navigate('/items')
    } catch (e) {
      console.error(e)
      showToast('保存中にエラーが発生しました。もう一度お試しください。', 'error')
    }
  }

  return (
    <div className="item-form">
      <div className="form-header">
        <button onClick={() => navigate('/items')} className="btn-back">← 一覧に戻る</button>
        <h2>{isEdit ? '品目を編集' : '品目を追加'}</h2>
        <div className="header-actions">
          <button onClick={handleSave} className="btn-save">保存</button>
        </div>
      </div>

      <div className="form-section">
        <h3>品目情報</h3>
        <div className="form-group">
          <label>品名 <span className="required">*</span></label>
          <input
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            type="text"
            placeholder="例: リズム録音"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>単価</label>
            <input
              value={form.unitPrice}
              onChange={e => setForm(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
              type="number"
              step="1"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label>単位</label>
            <input
              value={form.unit}
              onChange={e => setForm(prev => ({ ...prev, unit: e.target.value }))}
              type="text"
              placeholder="例: 時間、曲"
            />
          </div>
          <div className="form-group">
            <label>並び順</label>
            <input
              value={form.sortOrder ?? ''}
              onChange={e => setForm(prev => ({ ...prev, sortOrder: e.target.value !== '' ? Number(e.target.value) : undefined }))}
              type="number"
              step="1"
              placeholder="例: 10"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
