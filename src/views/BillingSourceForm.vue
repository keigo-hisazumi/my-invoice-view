<template>
  <div class="source-form">
    <div class="form-header">
      <button @click="goBack" class="btn-back">← 一覧に戻る</button>
      <h2>{{ isEdit ? '請求元を編集' : '請求元を追加' }}</h2>
      <div class="header-actions">
        <button @click="saveSource" class="btn-save">保存</button>
      </div>
    </div>

    <div class="form-section">
      <h3>基本情報</h3>
      <div class="form-group">
        <label>会社名・屋号 <span class="required">*</span></label>
        <input v-model="source.name" type="text" placeholder="株式会社〇〇 / 山田 太郎" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>郵便番号</label>
          <input v-model="source.postalCode" type="text" placeholder="123-4567" />
        </div>
      </div>
      <div class="form-group">
        <label>住所</label>
        <input v-model="source.address" type="text" placeholder="東京都〇〇区..." />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>電話番号</label>
          <input v-model="source.phone" type="tel" placeholder="03-1234-5678" />
        </div>
        <div class="form-group">
          <label>メールアドレス</label>
          <input v-model="source.email" type="email" placeholder="info@example.com" />
        </div>
      </div>
      <div class="form-group">
        <label>インボイス登録番号</label>
        <input v-model="source.invoiceRegistrationNumber" type="text" placeholder="T1234567890123" />
      </div>
    </div>

    <div class="form-section">
      <h3>振込先情報</h3>
      <div class="form-row">
        <div class="form-group">
          <label>銀行名</label>
          <input v-model="source.bankName" type="text" placeholder="〇〇銀行" />
        </div>
        <div class="form-group">
          <label>支店名</label>
          <input v-model="source.bankBranch" type="text" placeholder="〇〇支店" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>口座種別</label>
          <select v-model="source.bankAccountType">
            <option value="">選択してください</option>
            <option value="普通">普通</option>
            <option value="当座">当座</option>
          </select>
        </div>
        <div class="form-group">
          <label>口座番号</label>
          <input v-model="source.bankAccountNumber" type="text" placeholder="1234567" />
        </div>
      </div>
      <div class="form-group">
        <label>口座名義</label>
        <input v-model="source.bankAccountHolder" type="text" placeholder="カブシキガイシャ〇〇" />
      </div>
    </div>

    <div class="form-section">
      <h3>備考</h3>
      <div class="form-group">
        <textarea v-model="source.notes" rows="4" placeholder="特記事項があればご記入ください"></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { authReady } from '../router'
import type { BillingSource } from '../types/invoice'

const route = useRoute()
const router = useRouter()

const editId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : ''
})

const isEdit = computed(() => editId.value !== '')

const source = reactive<Omit<BillingSource, 'id' | 'createdAt' | 'updatedAt'>>({
  name: '',
  postalCode: '',
  address: '',
  phone: '',
  email: '',
  invoiceRegistrationNumber: '',
  bankName: '',
  bankBranch: '',
  bankAccountType: '',
  bankAccountNumber: '',
  bankAccountHolder: '',
  notes: ''
})

const loadForEdit = async () => {
  await authReady
  const docRef = doc(db, 'billingSources', editId.value)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) {
    alert('指定された請求元が見つかりません')
    router.push('/billing-sources')
    return
  }
  const data = docSnap.data()
  if (data.uid !== auth.currentUser?.uid) {
    alert('アクセス権限がありません')
    router.push('/billing-sources')
    return
  }
  Object.assign(source, {
    name: data.name ?? '',
    postalCode: data.postalCode ?? '',
    address: data.address ?? '',
    phone: data.phone ?? '',
    email: data.email ?? '',
    invoiceRegistrationNumber: data.invoiceRegistrationNumber ?? '',
    bankName: data.bankName ?? '',
    bankBranch: data.bankBranch ?? '',
    bankAccountType: data.bankAccountType ?? '',
    bankAccountNumber: data.bankAccountNumber ?? '',
    bankAccountHolder: data.bankAccountHolder ?? '',
    notes: data.notes ?? ''
  })
}

const goBack = () => router.push('/billing-sources')

const saveSource = async () => {
  if (!source.name.trim()) {
    alert('会社名・屋号を入力してください')
    return
  }

  const uid = auth.currentUser?.uid
  if (!uid) return

  try {
    if (isEdit.value) {
      await updateDoc(doc(db, 'billingSources', editId.value), {
        ...source,
        updatedAt: serverTimestamp()
      })
      alert('請求元を更新しました')
    } else {
      await addDoc(collection(db, 'billingSources'), {
        ...source,
        uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      alert('請求元を追加しました')
    }
    router.push('/billing-sources')
  } catch (e) {
    console.error(e)
    alert('保存中にエラーが発生しました。もう一度お試しください。')
  }
}

onMounted(() => {
  if (isEdit.value) loadForEdit()
})
</script>

<style scoped>
.source-form {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.source-form * {
  box-sizing: border-box;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-header h2 {
  margin: 0;
  color: #2c3e50;
}

.btn-back {
  padding: 10px 20px;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-back:hover {
  background: #7f8c8d;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-save {
  padding: 10px 24px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-save:hover {
  background: #229954;
}

.form-section {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h3 {
  color: #34495e;
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #3498db;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #555;
  font-weight: 500;
}

.required {
  color: #e74c3c;
  margin-left: 4px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
}

@media (max-width: 768px) {
  .source-form {
    padding: 12px;
  }

  .form-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    padding: 16px;
  }

  .form-header h2 {
    text-align: center;
    font-size: 20px;
  }

  .btn-back {
    width: 100%;
    padding: 12px;
  }

  .header-actions {
    justify-content: stretch;
  }

  .btn-save {
    width: 100%;
    padding: 12px;
  }

  .form-section {
    padding: 16px;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    font-size: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .source-form {
    padding: 8px;
  }

  .form-header,
  .form-section {
    padding: 14px;
  }

  h3 {
    font-size: 16px;
  }
}
</style>
