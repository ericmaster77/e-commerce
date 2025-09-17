import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCwbjJWOTTPcinc7t2AkDQtH4vCe8fbJC4",
  authDomain: "rosa-oliva-ecommerce.firebaseapp.com",
  projectId: "rosa-oliva-ecommerce",
  storageBucket: "rosa-oliva-ecommerce.firebasestorage.app",
  messagingSenderId: "533387643564",
  appId: "1:533387643564:web:4bc546fdceaed110332d09"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;