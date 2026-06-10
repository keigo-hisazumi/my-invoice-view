import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  collection, query, where, getDocs, getDoc, addDoc, updateDoc, doc, serverTimestamp
} from 'firebase/firestore'
import { db, auth } from '../firebase'
import type { InvoiceData, InvoiceItem, BillingAddress, BillingSource, ItemMaster } from '../types/invoice'
import { useToast } from '../contexts/ToastContext'

function makeItem(): InvoiceItem {
  return { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, unit: '', amount: 0 }
}

const oneMonthLater = new Date()
oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)

function initialInvoice(): InvoiceData {
  return {
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0] ?? '',
    dueDate: oneMonthLater.toISOString().split('T')[0] ?? '',
    billingAddressId: undefined,
    clientName: '',
    clientAddress: '',
    clientPhone: '',
    billingSourceId: undefined,
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    items: [makeItem()],
    subtotal: 0,
    taxRate: 10,
    tax: 0,
    total: 0,
    notes: ''
  }
}

export default function InvoiceCreate() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const location = useLocation()
  const { show: showToast } = useToast()

  const isViewMode = location.pathname.startsWith('/view/')
  const isEditMode = location.pathname.startsWith('/edit/')

  const pageTitle = isViewMode ? '請求書詳細' : isEditMode ? '請求書編集' : '請求書作成'

  const [invoice, setInvoice] = useState<InvoiceData>(initialInvoice)
  const [billingAddresses, setBillingAddresses] = useState<BillingAddress[]>([])
  const [billingSources, setBillingSources] = useState<BillingSource[]>([])
  const [itemMasters, setItemMasters] = useState<ItemMaster[]>([])
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false)

  const selectedBillingAddress = invoice.billingAddressId
    ? billingAddresses.find(a => a.id === invoice.billingAddressId) ?? null
    : null
  const selectedBillingSource = invoice.billingSourceId
    ? billingSources.find(s => s.id === invoice.billingSourceId) ?? null
    : null

  const calcTotals = useCallback((items: InvoiceItem[], taxRate: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const tax = Math.round(subtotal * taxRate / 100)
    return { subtotal, tax, total: subtotal + tax }
  }, [])

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    Promise.all([
      getDocs(query(collection(db, 'billingAddresses'), where('uid', '==', uid))),
      getDocs(query(collection(db, 'billingSources'), where('uid', '==', uid))),
      getDocs(query(collection(db, 'itemMasters'), where('uid', '==', uid)))
    ]).then(([addrSnap, srcSnap, itemSnap]) => {
      setBillingAddresses(addrSnap.docs.map(d => ({ id: d.id, ...d.data() } as BillingAddress)))
      setBillingSources(srcSnap.docs.map(d => ({ id: d.id, ...d.data() } as BillingSource)))
      const raw = itemSnap.docs.map(d => ({ id: d.id, ...d.data() } as ItemMaster))
      raw.sort((a, b) => {
        const aO = a.sortOrder ?? Infinity
        const bO = b.sortOrder ?? Infinity
        return aO !== bO ? aO - bO : a.description.localeCompare(b.description, 'ja')
      })
      setItemMasters(raw)
    })
  }, [])

  useEffect(() => {
    if ((isViewMode || isEditMode) && id) {
      getDoc(doc(db, 'invoices', id)).then(snap => {
        if (!snap.exists()) return
        const data = snap.data()
        if (data['uid'] !== auth.currentUser?.uid) {
          alert('アクセス権限がありません')
          navigate('/')
          return
        }
        setInvoice(prev => ({
          ...prev,
          ...data,
          createdAt: data['createdAt']?.toDate?.()?.toISOString() ?? data['createdAt'],
          updatedAt: data['updatedAt']?.toDate?.()?.toISOString() ?? data['updatedAt']
        }) as InvoiceData)
      })
    }
  }, [id, isViewMode, isEditMode, navigate])

  const generateInvoiceNumber = async (billingAddressId: string): Promise<string> => {
    const uid = auth.currentUser?.uid
    if (!uid) return ''
    const address = billingAddresses.find(a => a.id === billingAddressId)
    if (!address?.customerCode) return ''
    const customerCode = address.customerCode
    const now = new Date()
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    const prefix = `${customerCode}-${yyyymm}-`
    const snap = await getDocs(query(collection(db, 'invoices'), where('uid', '==', uid), where('billingAddressId', '==', billingAddressId)))
    let maxSeq = 0
    snap.forEach(d => {
      const num = d.data()['invoiceNumber'] as string | undefined
      if (num?.startsWith(prefix)) {
        const seq = parseInt(num.slice(prefix.length), 10)
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq
      }
    })
    return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`
  }

  const onBillingAddressChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const addrId = e.target.value
    setInvoice(prev => ({ ...prev, billingAddressId: addrId || undefined }))
    if (!addrId) return
    setIsGeneratingNumber(true)
    try {
      const num = await generateInvoiceNumber(addrId)
      setInvoice(prev => ({ ...prev, invoiceNumber: num }))
    } finally {
      setIsGeneratingNumber(false)
    }
  }

  const getItemMasterId = (description: string) => {
    return itemMasters.find(m => m.description === description)?.id ?? ''
  }

  const updateItemAt = (index: number, updates: Partial<InvoiceItem>) => {
    setInvoice(prev => {
      const items = prev.items.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, ...updates }
        updated.amount = updated.quantity * updated.unitPrice
        return updated
      })
      return { ...prev, items, ...calcTotals(items, prev.taxRate) }
    })
  }

  const onPresetChange = (index: number, masterId: string) => {
    const master = itemMasters.find(m => m.id === masterId)
    if (master) {
      updateItemAt(index, { description: master.description, unitPrice: master.unitPrice, unit: master.unit })
    } else {
      updateItemAt(index, { description: '', unitPrice: 0, unit: '' })
    }
  }

  const addItem = () => {
    setInvoice(prev => {
      const items = [...prev.items, makeItem()]
      return { ...prev, items, ...calcTotals(items, prev.taxRate) }
    })
  }

  const removeItem = (index: number) => {
    setInvoice(prev => {
      if (prev.items.length <= 1) return prev
      const items = prev.items.filter((_, i) => i !== index)
      return { ...prev, items, ...calcTotals(items, prev.taxRate) }
    })
  }

  const saveInvoice = async () => {
    if (!invoice.invoiceNumber) {
      showToast('請求書番号が設定されていません。請求先を選択すると自動採番されます。', 'error')
      return
    }
    if (!invoice.billingAddressId) {
      showToast('請求先を選択してください', 'error')
      return
    }
    if (!invoice.billingSourceId) {
      showToast('請求元を選択してください', 'error')
      return
    }
    const uid = auth.currentUser?.uid
    if (!uid) return
    const clientName = selectedBillingAddress?.name ?? invoice.clientName
    try {
      if (isEditMode && id) {
        await updateDoc(doc(db, 'invoices', id), { ...invoice, clientName, updatedAt: serverTimestamp() })
        showToast('請求書を更新しました')
      } else {
        await addDoc(collection(db, 'invoices'), { ...invoice, clientName, uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
        showToast('請求書を保存しました')
      }
      navigate('/')
    } catch (e) {
      console.error(e)
      showToast('保存中にエラーが発生しました。もう一度お試しください。', 'error')
    }
  }

  return (
    <div className="invoice-form">
      <div className="form-header">
        <button onClick={() => navigate('/')} className="btn-back">← 一覧に戻る</button>
        <h2>{pageTitle}</h2>
        <div className="header-actions">
          {isViewMode && <button onClick={() => navigate(`/print/${id}`)} className="btn-pdf">PDF出力</button>}
          {isViewMode && <button onClick={() => navigate(`/edit/${id}`)} className="btn-edit-header">編集</button>}
          {!isViewMode && <button onClick={saveInvoice} className="btn-save">保存</button>}
        </div>
      </div>

      <div className="form-section">
        <h3>基本情報</h3>
        <div className="form-row">
          <div className="form-group">
            <label>請求書番号</label>
            {!isViewMode ? (
              <div className="invoice-number-field">
                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={e => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  placeholder="顧客選択時に自動採番されます"
                  readOnly={isGeneratingNumber}
                  className={isGeneratingNumber ? 'readonly-field' : ''}
                />
                {isGeneratingNumber && <span className="generating-badge">採番中...</span>}
                {!isGeneratingNumber && invoice.invoiceNumber && invoice.billingAddressId && (
                  <span className="auto-generated-badge">自動採番済み</span>
                )}
              </div>
            ) : (
              <input type="text" value={invoice.invoiceNumber} readOnly className="readonly-field" />
            )}
          </div>
          <div className="form-group">
            <label>請求日</label>
            <input
              type="date"
              value={invoice.invoiceDate}
              onChange={e => setInvoice(prev => ({ ...prev, invoiceDate: e.target.value }))}
              readOnly={isViewMode}
              className={isViewMode ? 'readonly-field' : ''}
            />
          </div>
          <div className="form-group">
            <label>支払期限</label>
            <input
              type="date"
              value={invoice.dueDate}
              onChange={e => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
              readOnly={isViewMode}
              className={isViewMode ? 'readonly-field' : ''}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>請求先情報</h3>
        <div className="form-group">
          <label>お客様名 {!isViewMode && <span className="required">*</span>}</label>
          {!isViewMode ? (
            <select className="form-select" value={invoice.billingAddressId ?? ''} onChange={onBillingAddressChange}>
              <option value="">-- 選択してください --</option>
              {billingAddresses.map(addr => (
                <option key={addr.id} value={addr.id}>
                  {addr.name}{addr.contactPerson ? ` (${addr.contactPerson})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <input type="text" value={selectedBillingAddress?.name ?? invoice.clientName} readOnly className="readonly-field" />
          )}
        </div>
        {selectedBillingAddress && (
          <div className="billing-info-display">
            <div className="info-row"><span className="label">会社名:</span><span className="value">{selectedBillingAddress.name}</span></div>
            {selectedBillingAddress.contactPerson && <div className="info-row"><span className="label">担当者:</span><span className="value">{selectedBillingAddress.contactPerson}</span></div>}
            <div className="info-row"><span className="label">住所:</span><span className="value">{selectedBillingAddress.postalCode ? `〒${selectedBillingAddress.postalCode} ` : ''}{selectedBillingAddress.address}</span></div>
            <div className="info-row"><span className="label">電話番号:</span><span className="value">{selectedBillingAddress.phone}</span></div>
            {selectedBillingAddress.email && <div className="info-row"><span className="label">メールアドレス:</span><span className="value">{selectedBillingAddress.email}</span></div>}
          </div>
        )}
      </div>

      <div className="form-section">
        <h3>請求元情報</h3>
        <div className="form-group">
          <label>会社名 {!isViewMode && <span className="required">*</span>}</label>
          {!isViewMode ? (
            <select className="form-select" value={invoice.billingSourceId ?? ''} onChange={e => setInvoice(prev => ({ ...prev, billingSourceId: e.target.value || undefined }))}>
              <option value="">-- 選択してください --</option>
              {billingSources.map(src => (
                <option key={src.id} value={src.id}>{src.name}</option>
              ))}
            </select>
          ) : (
            <input type="text" value={selectedBillingSource?.name ?? invoice.companyName} readOnly className="readonly-field" />
          )}
        </div>
        {selectedBillingSource && (
          <div className="billing-info-display">
            <div className="info-row"><span className="label">会社名:</span><span className="value">{selectedBillingSource.name}</span></div>
            <div className="info-row"><span className="label">住所:</span><span className="value">{selectedBillingSource.postalCode ? `〒${selectedBillingSource.postalCode} ` : ''}{selectedBillingSource.address}</span></div>
            <div className="info-row"><span className="label">電話番号:</span><span className="value">{selectedBillingSource.phone}</span></div>
            <div className="info-row"><span className="label">メールアドレス:</span><span className="value">{selectedBillingSource.email}</span></div>
            {selectedBillingSource.invoiceRegistrationNumber && <div className="info-row"><span className="label">インボイス登録番号:</span><span className="value">{selectedBillingSource.invoiceRegistrationNumber}</span></div>}
          </div>
        )}
      </div>

      <div className="form-section">
        <h3>明細</h3>
        <div className="items-header">
          <span className="col-desc">品名</span>
          <span className="col-qty">数量</span>
          <span className="col-unit">単位</span>
          <span className="col-price">単価</span>
          <span className="col-amount">金額</span>
          <span className="col-actions"></span>
        </div>
        {invoice.items.map((item, index) => (
          <div key={item.id} className="item-row">
            <div className="item-cell col-desc">
              <span className="item-label">品名</span>
              {!isViewMode ? (
                <select value={getItemMasterId(item.description)} onChange={e => onPresetChange(index, e.target.value)}>
                  <option value="">選択してください</option>
                  {itemMasters.map(m => <option key={m.id} value={m.id}>{m.description}</option>)}
                </select>
              ) : (
                <span className="readonly-value">{item.description || '-'}</span>
              )}
            </div>
            <div className="item-cell col-qty">
              <span className="item-label">数量</span>
              {!isViewMode ? (
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={item.quantity}
                  onChange={e => updateItemAt(index, { quantity: Number(e.target.value) })}
                />
              ) : (
                <span className="readonly-value">{item.quantity}</span>
              )}
            </div>
            <div className="item-cell col-unit">
              <span className="item-label">単位</span>
              <span className="unit-value">{item.unit || '-'}</span>
            </div>
            <div className="item-cell col-price">
              <span className="item-label">単価</span>
              {!isViewMode ? (
                <input
                  type="number"
                  step="1"
                  value={item.unitPrice}
                  onChange={e => updateItemAt(index, { unitPrice: Number(e.target.value) })}
                />
              ) : (
                <span className="readonly-value">￥{item.unitPrice.toLocaleString()}</span>
              )}
            </div>
            <div className="item-cell col-amount">
              <span className="item-label">金額</span>
              <span className="amount-value">￥{item.amount.toLocaleString()}</span>
            </div>
            {!isViewMode ? (
              <button onClick={() => removeItem(index)} className="btn-remove col-actions">削除</button>
            ) : (
              <span className="col-actions"></span>
            )}
          </div>
        ))}
        {!isViewMode && <button onClick={addItem} className="btn-add">+ 明細を追加</button>}
      </div>

      <div className="form-section">
        <h3>金額</h3>
        <div className="form-row">
          <div className="form-group">
            <label>消費税率 (%)</label>
            {!isViewMode ? (
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={invoice.taxRate}
                onChange={e => {
                  const taxRate = Number(e.target.value)
                  setInvoice(prev => ({ ...prev, taxRate, ...calcTotals(prev.items, taxRate) }))
                }}
              />
            ) : (
              <input type="number" value={invoice.taxRate} readOnly className="readonly-field" />
            )}
          </div>
        </div>
        <div className="totals">
          <div className="total-row"><span>小計:</span><span>￥{invoice.subtotal.toLocaleString()}</span></div>
          <div className="total-row"><span>消費税 ({invoice.taxRate}%):</span><span>￥{invoice.tax.toLocaleString()}</span></div>
          <div className="total-row total-final"><span>合計:</span><span>￥{invoice.total.toLocaleString()}</span></div>
        </div>
      </div>

      <div className="form-section">
        <h3>備考</h3>
        <div className="form-group">
          {!isViewMode ? (
            <textarea
              rows={4}
              placeholder="特記事項があればご記入ください"
              value={invoice.notes}
              onChange={e => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
            />
          ) : (
            <textarea rows={4} value={invoice.notes} readOnly className="readonly-field" />
          )}
        </div>
      </div>

      {!isViewMode && (
        <div className="form-footer">
          <button onClick={saveInvoice} className="btn-save btn-save-footer">保存</button>
        </div>
      )}
    </div>
  )
}
