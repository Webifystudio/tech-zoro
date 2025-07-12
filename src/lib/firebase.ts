import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDat9BP3QffC2hzxWAEeGrKNEeaWejteK4",
  authDomain: "tech-zoro.firebaseapp.com",
  databaseURL: "https://tech-zoro-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tech-zoro",
  storageBucket: "tech-zoro.appspot.com",
  messagingSenderId: "588736971823",
  appId: "1:588736971823:web:571ca28714cba8136032da",
  measurementId: "G-8L19QD2GKM"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let db: Firestore | null = null;
let isFirebaseConfigured = false;

// We only want to initialize firebase on the client
if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
    try {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
        googleProvider = new GoogleAuthProvider();
        isFirebaseConfigured = true;
    } catch (e) {
        console.error('Failed to initialize Firebase', e);
        // Set all to null and configured to false
        isFirebaseConfigured = false;
        app = null;
        auth = null;
        googleProvider = null;
        db = null;
    }
}

export { app, auth, db, googleProvider, isFirebaseConfigured };
