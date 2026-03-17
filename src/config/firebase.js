import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, setDoc, getDoc, updateDoc, deleteDoc as firestoreDeleteDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDgPZpHwucTq7jFrhPhxoUHDl7VhX8Kpos",
  authDomain: "ai-assistant-8473f.firebaseapp.com",
  projectId: "ai-assistant-8473f",
  storageBucket: "ai-assistant-8473f.firebasestorage.app",
  messagingSenderId: "123677525450",
  appId: "1:123677525450:web:4de8b7a144ad8784a47b33",
  measurementId: "G-3W01KHX1W5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { 
  db, auth, storage, collection, addDoc, getDocs, query, where, doc, setDoc, getDoc, updateDoc, firestoreDeleteDoc, 
  serverTimestamp, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, 
  updateProfile, ref, uploadBytes, getDownloadURL 
};
