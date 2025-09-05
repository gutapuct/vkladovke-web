import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjRqjqWbtx_QIPsobH4J72jg98xNTt-BM",
  authDomain: "vkladovke-8254f.firebaseapp.com",
  projectId: "vkladovke-8254f",
  storageBucket: "vkladovke-8254f.firebasestorage.app",
  messagingSenderId: "441252569285",
  appId: "1:441252569285:web:585c9366e7506cf78890ac",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const getHighscore = async () => {
  const docRef = doc(db, "HighScore", "Current");
  const docSnap = await getDoc(docRef);

  return docSnap.data().score;
};

const uploadHighscore = async (newScore) => {
  const docRef = doc(db, "HighScore", "Current");
  const result = await updateDoc(docRef, {
    score: parseInt(newScore),
  });

  return newScore;
};

export { getHighscore, uploadHighscore };
