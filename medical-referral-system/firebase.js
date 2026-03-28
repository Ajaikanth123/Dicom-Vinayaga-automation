import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDzZ33c9T1kocj5MeuJXqrxfhNlQWzoMew",
  authDomain: "cscanskovai-44ebc.firebaseapp.com",
  databaseURL: "https://cscanskovai-44ebc-default-rtdb.firebaseio.com",
  projectId: "cscanskovai-44ebc",
  storageBucket: "cscanskovai-44ebc.firebasestorage.app",
  messagingSenderId: "517537048458",
  appId: "1:517537048458:web:578384bd7b01286c8c0a73",
  measurementId: "G-PRHC6Z3L46"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;
