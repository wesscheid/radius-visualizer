import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB1cUyqPJFWjm0Sttdu9S8uWzcR1FPcwg8",
  authDomain: "mapr-12222.firebaseapp.com",
  projectId: "mapr-12222",
  storageBucket: "mapr-12222.firebasestorage.app",
  messagingSenderId: "230329881328",
  appId: "1:230329881328:web:8702f5e41b4f178778e835",
  measurementId: "G-54MKJ1FYEE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;