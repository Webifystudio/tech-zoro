
'use server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';


export async function uploadImage(
  base64Image: string,
  appId: string
): Promise<{url: string; error?: undefined} | {error: string; url?: undefined}> {
  
  if (!db || !appId) {
    return { error: 'Database or App ID not configured for image upload.' };
  }

  try {
    const appRef = doc(db, 'apps', appId);
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
