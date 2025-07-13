
'use server';
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, doc, getDoc, type Firestore } from "firebase/firestore";

const ZORO_FALLBACK_IMGBB_API_KEY = "cebcb7546aca25ed5c92ab3ff6491b1c";

// This is a separate admin-like initialization for server-side actions.
// It should not be bundled with client-side code.
const firebaseConfig = {
  apiKey: "AIzaSyBPDoh0znVAGCKNav2qX9gqh4eVGSoDLi0",
  authDomain: "tech-zoro.firebaseapp.com",
  databaseURL: "https://tech-zoro-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tech-zoro",
  storageBucket: "tech-zoro.firebasestorage.app",
  messagingSenderId: "588736971823",
  appId: "1:588736971823:web:571ca28714cba8136032da",
  measurementId: "G-8L19QD2GKM"
};

let adminApp: FirebaseApp;
if (!getApps().some(app => app.name === 'admin')) {
  adminApp = initializeApp(firebaseConfig, 'admin');
} else {
  adminApp = getApps().find(app => app.name === 'admin')!;
}
const adminDb: Firestore = getFirestore(adminApp);


export async function uploadImageForProfile(
  base64Image: string
): Promise<{url: string; error?: undefined} | {error: string; url?: undefined}> {
  try {
    const formData = new FormData();
    formData.append('image', base64Image.split(',')[1]);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${ZORO_FALLBACK_IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ImgBB profile upload failed:', errorText);
      return {error: `Image upload failed: ${response.statusText} - ${errorText}`};
    }

    const result = await response.json();
    if (result.data?.url) {
      return {url: result.data.url};
    } else {
      console.error('ImgBB profile upload error response:', result);
      return {error: result?.error?.message || 'Failed to get image URL from ImgBB response.'};
    }
  } catch (error: any) {
     console.error('Error uploading profile image:', error);
    return {
      error: error.message || 'An unknown error occurred during image upload.',
    };
  }
}


export async function uploadImage(
  base64Image: string,
  appId: string
): Promise<{url: string; error?: undefined} | {error: string; url?: undefined}> {
  
  if (!appId) {
    return { error: 'App ID is required for image upload.' };
  }

  try {
    const appRef = doc(adminDb, 'apps', appId);
    const appSnap = await getDoc(appRef);

    if (!appSnap.exists()) {
      return { error: 'Application not found.' };
    }

    const apiKey = appSnap.data()?.setup?.imgbbApiKey;
    if (!apiKey) {
      return { error: 'ImgBB API Key is not configured for this application. Please add it in the Setup page.' };
    }
    
    const formData = new FormData();
    // The image needs to be sent as base64 string without the data URI prefix
    formData.append('image', base64Image.split(',')[1]);


    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ImgBB upload failed:', errorText);
      return {error: `Image upload failed: ${response.statusText} - ${errorText}`};
    }

    const result = await response.json();

    if (result.data?.url) {
      return {url: result.data.url};
    } else {
      console.error('ImgBB upload error response:', result);
      return {error: result?.error?.message || 'Failed to get image URL from ImgBB response.'};
    }
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return {
      error: error.message || 'An unknown error occurred during image upload.',
    };
  }
}
