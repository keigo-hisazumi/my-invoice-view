import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { useToast } from '../contexts/ToastContext'

interface FormData {
  name: string
  postalCode: string
  address: string
  phone: string
  email: string
  invoiceRegistrationNumber: string
  bankName: string
  bankBranch: string
  bankAccountType: string
  bankAccountNumber: string
  bankAccountHolder: string
  notes: string
}

export default function BillingSourceForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const { show: showToast } = useToast()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>({
    name: '', postalCode: '', address: '', phone: '', email: '',
    invoiceRegistrationNumber: '', bankName: '', bankBranch: '',
    bankAccountType: '', bankAccountNumber: '', bankAccountHolder: '', notes: ''
  })

  useEffect(() => {
    if (!isEdit || !id) return
    const load = async () => {
      const docSnap = await getDoc(doc(db, 'billingSources', id))
      if (!docSnap.exists()) {
        alert('指定された請求元が見つかりません')
        navigate('/billing-sources')
        return
      }
      const data = docSnap.data()
      if (data['uid'] !== auth.currentUser?.uid) {
        alert('アクセス権限がありません')
        navigate('/billing-sources')
        return
      }
      setForm({
        name: data['name'] ?? '',
        postalCode: data['postalCode'] ?? '',
        address: data['address'] ?? '',
        phone: data['phone'] ?? '',
        email: data['email'] ?? '',
        invoiceRegistrationNumber: data['invoiceRegistrationNumber'] ?? '',
        bankName: data['bankName'] ?? '',
        bankBranch: data['bankBranch'] ?? '',
        bankAccountType: data['bankAccountType'] ?? '',
        bankAccountNumber: data['bankAccountNumber'] ?? '',
        bankAccountHolder: data['bankAccountHolder'] ?? '',
        notes: data['notes'] ?? ''
      })
    }
    load()
  }, [id, isEdit, navigate])

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('会社名・屋号を入力してください', 'error')
      return
    }
    const uid = auth.currentUser?.uid
    if (!uid) return
    try {
      if (isEdit && id) {
        await updateDoc(doc(db, 'billingSources', id), { ...form, updatedAt: serverTimestamp() })
        showToast('請求元を更新しました')
      } else {
        await addDoc(collection(db, 'billingSources'), { ...form, uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
        showToast('請求元を追加しました')
      }
      navigate('/billing-sources')
    } catch (e) {
      console.error(e)
      showToast('保存中にエラーが発生しました。もう一度お試しください。', 'error')
    }
  }

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="source-form">
      <div className="form-header">
        <button onClick={() => navigate('/billing-sources')} className="btn-back">← 一覧に戻る</button>
        <h2>{isEdit ? '請求元を編集' : '請求元を追加'}</h2>
        <div className="header-actions">
          <button onClick={handleSave} className="btn-save">保存</button>
        </div>
      </div>

      <div className="form-section">
        <h3>基本情報</h3>
        <div className="form-group">
          <label>会社名・屋号 <span className="required">*</span></label>
          <input value={form.name} onChange={set('name')} type="text" placeholder="株式会社〇〇 / 山田 太郎" />
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
        <div className="form-group">
          <label>インボイス登録番号</label>
          <input value={form.invoiceRegistrationNumber} onChange={set('invoiceRegistrationNumber')} type="text" placeholder="T1234567890123" />
        </div>
      </div>

      <div className="form-section">
        <h3>振込先情報</h3>
        <div className="form-row">
          <div className="form-group">
            <label>銀行名</label>
            <input value={form.bankName} onChange={set('bankName')} type="text" placeholder="〇〇銀行" />
          </div>
          <div className="form-group">
            <label>支店名</label>
            <input value={form.bankBranch} onChange={set('bankBranch')} type="text" placeholder="〇〇支店" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>口座種別</label>
            <select value={form.bankAccountType} onChange={set('bankAccountType')}>
              <option value="">選択してください</option>
              <option value="普通">普通</option>
              <option value="当座">当座</option>
            </select>
          </div>
          <div className="form-group">
            <label>口座番号</label>
            <input value={form.bankAccountNumber} onChange={set('bankAccountNumber')} type="text" placeholder="1234567" />
          </div>
        </div>
        <div className="form-group">
          <label>口座名義</label>
          <input value={form.bankAccountHolder} onChange={set('bankAccountHolder')} type="text" placeholder="カブシキガイシャ〇〇" />
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
