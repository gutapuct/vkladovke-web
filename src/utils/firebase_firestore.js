import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDjRqjqWbtx_QIPsobH4J72jg98xNTt-BM",
  authDomain: "vkladovke-8254f.firebaseapp.com",
  projectId: "vkladovke-8254f",
  storageBucket: "vkladovke-8254f.firebasestorage.app",
  messagingSenderId: "441252569285",
  appId: "1:441252569285:web:585c9366e7506cf78890ac",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
