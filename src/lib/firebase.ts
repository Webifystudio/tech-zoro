import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBPDoh0znVAGCKNav2qX9gqh4eVGSoDLi0",
  authDomain: "tech-zoro.firebaseapp.com",
  databaseURL: "https://tech-zoro-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tech-zoro",
  storageBucket: "tech-zoro.appspot.com",
  messagingSenderId: "588736971823",
  appId: "1:588736971823:web:571ca28714cba8136032da",
  measurementId: "G-8L19QD2GKM"
};

const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app: FirebaseApp | null = null;
if (isFirebaseConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

const auth: Auth | null = app ? getAuth(app) : null;

export { app, auth, isFirebaseConfigured };
