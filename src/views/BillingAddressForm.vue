<template>
  <div class="address-form">
    <div class="form-header">
      <button @click="goBack" class="btn-back">← 一覧に戻る</button>
      <h2>{{ isEdit ? '請求先を編集' : '請求先を追加' }}</h2>
      <div class="header-actions">
        <button @click="saveAddress" class="btn-save">保存</button>
      </div>
    </div>

    <div class="form-section">
      <h3>請求先情報</h3>
      <div class="form-group">
        <label>請求先名 <span class="required">*</span></label>
        <input v-model="address.name" type="text" placeholder="株式会社〇〇" />
      </div>
      <div class="form-group">
        <label>担当者名</label>
        <input v-model="address.contactPerson" type="text" placeholder="山田 太郎" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>郵便番号</label>
          <input v-model="address.postalCode" type="text" placeholder="123-4567" />
        </div>
      </div>
      <div class="form-group">
        <label>住所</label>
        <input v-model="address.address" type="text" placeholder="東京都〇〇区..." />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>電話番号</label>
          <input v-model="address.phone" type="tel" placeholder="03-1234-5678" />
        </div>
        <div class="form-group">
          <label>メールアドレス</label>
          <input v-model="address.email" type="email" placeholder="info@example.com" />
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3>備考</h3>
      <div class="form-group">
        <textarea v-model="address.notes" rows="4" placeholder="特記事項があればご記入ください"></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../firebase'
import type { BillingAddress } from '../types/invoice'

const route = useRoute()
const router = useRouter()

const editId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : ''
})

const isEdit = computed(() => editId.value !== '')

const address = reactive<Omit<BillingAddress, 'id' | 'createdAt' | 'updatedAt'>>({
  name: '',
  contactPerson: '',
  postalCode: '',
  address: '',
  phone: '',
  email: '',
  notes: ''
})

const loadForEdit = async () => {
  const docRef = doc(db, 'billingAddresses', editId.value)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) {
    alert('指定された請求先が見つかりません')
    router.push('/billing-addresses')
    return
  }
  const data = docSnap.data()
  if (data.uid !== auth.currentUser?.uid) {
    alert('アクセス権限がありません')
    router.push('/billing-addresses')
    return
  }
  Object.assign(address, {
    name: data.name ?? '',
    contactPerson: data.contactPerson ?? '',
    postalCode: data.postalCode ?? '',
    address: data.address ?? '',
    phone: data.phone ?? '',
    email: data.email ?? '',
    notes: data.notes ?? ''
  })
}

const goBack = () => router.push('/billing-addresses')

const saveAddress = async () => {
  if (!address.name.trim()) {
    alert('請求先名を入力してください')
    return
  }

  const uid = auth.currentUser?.uid
  if (!uid) return

  if (isEdit.value) {
    await updateDoc(doc(db, 'billingAddresses', editId.value), {
      ...address,
      updatedAt: serverTimestamp()
    })
    alert('請求先を更新しました')
  } else {
    await addDoc(collection(db, 'billingAddresses'), {
      ...address,
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    alert('請求先を追加しました')
  }

  router.push('/billing-addresses')
}

onMounted(() => {
  if (isEdit.value) loadForEdit()
})
</script>

<style scoped>
.address-form {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.address-form * {
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
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
}

@media (max-width: 768px) {
  .address-form {
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
  .form-group textarea {
    font-size: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .address-form {
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
