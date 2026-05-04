import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAdmh7rlKZbuiksbkPkpTA6LvMVdyEAwss',
  authDomain: 'my-project-89f56.firebaseapp.com',
  projectId: 'my-project-89f56',
  storageBucket: 'my-project-89f56.firebasestorage.app',
  messagingSenderId: '727137485459',
  appId: '1:727137485459:web:57baa7b8b6666ee2fa0366',
  measurementId: 'G-RZMYK4MGQB'
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
