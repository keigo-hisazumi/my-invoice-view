import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, addDoc, updateDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { useToast } from '../contexts/ToastContext'

interface FormData {
  customerCode: string
  name: string
  contactPerson: string
  postalCode: string
  address: string
  phone: string
  email: string
  notes: string
}

export default function BillingAddressForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const { show: showToast } = useToast()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>({
    customerCode: '', name: '', contactPerson: '', postalCode: '',
    address: '', phone: '', email: '', notes: ''
  })

  useEffect(() => {
    if (!isEdit || !id) return
    const load = async () => {
      const docSnap = await getDoc(doc(db, 'billingAddresses', id))
      if (!docSnap.exists()) {
        alert('指定された請求先が見つかりません')
        navigate('/billing-addresses')
        return
      }
      const data = docSnap.data()
      if (data['uid'] !== auth.currentUser?.uid) {
        alert('アクセス権限がありません')
        navigate('/billing-addresses')
        return
      }
      setForm({
        customerCode: data['customerCode'] ?? '',
        name: data['name'] ?? '',
        contactPerson: data['contactPerson'] ?? '',
        postalCode: data['postalCode'] ?? '',
        address: data['address'] ?? '',
        phone: data['phone'] ?? '',
        email: data['email'] ?? '',
        notes: data['notes'] ?? ''
      })
    }
    load()
  }, [id, isEdit, navigate])

  const generateCustomerCode = async (uid: string): Promise<string> => {
    const snap = await getDocs(query(collection(db, 'billingAddresses'), where('uid', '==', uid)))
    let maxNum = 0
    snap.forEach(d => {
      const code = d.data()['customerCode'] as string | undefined
      if (code && /^C\d+$/.test(code)) {
        const n = parseInt(code.slice(1), 10)
        if (n > maxNum) maxNum = n
      }
    })
    return `C${String(maxNum + 1).padStart(5, '0')}`
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('請求先名を入力してください', 'error')
      return
    }
    const uid = auth.currentUser?.uid
    if (!uid) return
    try {
      if (isEdit && id) {
        await updateDoc(doc(db, 'billingAddresses', id), { ...form, updatedAt: serverTimestamp() })
        showToast('請求先を更新しました')
      } else {
        const customerCode = await generateCustomerCode(uid)
        await addDoc(collection(db, 'billingAddresses'), { ...form, customerCode, uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
        showToast('請求先を追加しました')
      }
      navigate('/billing-addresses')
    } catch (e) {
      console.error(e)
      showToast('保存中にエラーが発生しました。もう一度お試しください。', 'error')
    }
  }

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="address-form">
      <div className="form-header">
        <button onClick={() => navigate('/billing-addresses')} className="btn-back">← 一覧に戻る</button>
        <h2>{isEdit ? '請求先を編集' : '請求先を追加'}</h2>
        <div className="header-actions">
          <button onClick={handleSave} className="btn-save">保存</button>
        </div>
      </div>

      <div className="form-section">
        <h3>請求先情報</h3>
        {isEdit ? (
          <div className="form-group">
            <label>顧客コード</label>
            <input value={form.customerCode} type="text" disabled className="input-readonly" />
          </div>
        ) : (
          <div className="form-group customer-code-preview">
            <label>顧客コード</label>
            <span className="code-auto-badge">保存時に自動採番されます</span>
          </div>
        )}
        <div className="form-group">
          <label>請求先名 <span className="required">*</span></label>
          <input value={form.name} onChange={set('name')} type="text" placeholder="株式会社〇〇" />
        </div>
        <div className="form-group">
          <label>担当者名</label>
          <input value={form.contactPerson} onChange={set('contactPerson')} type="text" placeholder="山田 太郎" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>郵便番号</label>
            <input value={form.postalCode} onChange={set('postalCode')} type="text" placeholder="123-4567" />
          </div>
        </div>
        <div className="form-group">
          <label>住所</label>
          <input value={form.address} onChange={set('address')} type="text" placeholder="東京都〇〇区..." />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>電話番号</label>
            <input value={form.phone} onChange={set('phone')} type="tel" placeholder="03-1234-5678" />
          </div>
          <div className="form-group">
            <label>メールアドレス</label>
            <input value={form.email} onChange={set('email')} type="email" placeholder="info@example.com" />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>備考</h3>
        <div className="form-group">
          <textarea value={form.notes} onChange={set('notes')} rows={4} placeholder="特記事項があればご記入ください" />
        </div>
      </div>
    </div>
  )
}
