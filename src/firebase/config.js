// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
   apiKey: "AIzaSyAyyKGNACEQI1qxNez5vMlRf7iMP8xHRPk",
  authDomain: "life-ai-app.firebaseapp.com",
  projectId: "life-ai-app",
  storageBucket: "life-ai-app.firebasestorage.app",
  messagingSenderId: "553361716563",
  appId: "1:553361716563:web:cca39b9e6a20076b529da6",
  measurementId: "G-WLTBM57DVD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);