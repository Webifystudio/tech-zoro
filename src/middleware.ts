
import { NextResponse, type NextRequest } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection } from 'firebase/firestore';

// IMPORTANT: This duplicates the config because middleware runs in a separate Edge environment
// and cannot import from server-side files. Ensure this is in sync with your main firebase.ts
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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// These are your app's default Vercel/Firebase hosting domains.
// Add any other default domains here.
const APP_HOSTING_DOMAINS = [
    'localhost:9002', // For local development
    process.env.NEXT_PUBLIC_VERCEL_URL,
    process.env.NEXT_PUBLIC_FIREBASE_URL,
    'tech-zoro.web.app',
    'tech-zoro.firebaseapp.com'
].filter(Boolean);


export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host')!;

  // Check if the request is for a known app hosting domain. If so, do nothing.
  if (APP_HOSTING_DOMAINS.some(domain => hostname.endsWith(domain!))) {
    return NextResponse.next();
  }

  try {
    const domainRef = doc(db, 'domains', hostname);
    const domainSnap = await getDoc(domainRef);

    if (domainSnap.exists()) {
      const { appId } = domainSnap.data();
      const path = url.pathname;
      
      // Rewrite the URL to the corresponding store path
      // e.g., custom.com/products -> /store/app123/products
      const newUrl = new URL(`/store/${appId}${path}`, request.url);
      
      // Add search params if any
      if (request.nextUrl.search) {
        newUrl.search = request.nextUrl.search;
      }

      return NextResponse.rewrite(newUrl);
    }
  } catch (error) {
    console.error(`Middleware error for domain ${hostname}:`, error);
    // You might want to redirect to an error page or show a generic page
    // For now, we'll let it pass through to the default behavior.
  }

  // If domain is not found or an error occurs, let it proceed to the default site.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
