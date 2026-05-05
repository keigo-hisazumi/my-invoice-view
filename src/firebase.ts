import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyClz8EizFso9U5SeRzK9o7eGFxY7-9MTMk',
  authDomain: 'my-invoice-78982.firebaseapp.com',
  projectId: 'my-invoice-78982',
  storageBucket: 'my-invoice-78982.firebasestorage.app',
  messagingSenderId: '116305202316',
  appId: '1:116305202316:web:37802e7dbbfef63c8d7fa9',
  measurementId: 'G-Q0KR1XQJ8D'
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
