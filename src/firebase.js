import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCfySuJsG2xJmz9Zt7uWD21JAqn6p7JCx0",
  authDomain: "rcom-app.firebaseapp.com",
  databaseURL: "https://rcom-app-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "rcom-app",
  storageBucket: "rcom-app.firebasestorage.app",
  messagingSenderId: "450371502469",
  appId: "1:450371502469:web:10d6dc27ba438f72fa84ec",
  measurementId: "G-VRNV6J8WHE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
export const ADMIN_UID = "ImB6u7fpdZbibN3LyCaAnwbHZZq1";
export const WHATSAPP = "2250160672966";
export default app;
