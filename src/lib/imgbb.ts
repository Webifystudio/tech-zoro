
'use server';

import { Blob } from 'buffer';

export async function uploadImage(
  formData: FormData
): Promise<{url: string; error?: undefined} | {error: string; url?: undefined}> {
  const apiKey = '2bb2346a6a907388d8a3b0beac2bca86';
  const image = formData.get('image') as File | null;

  if (!image) {
    return {error: 'No image file provided.'};
  }

  // Convert File to a format suitable for server-side fetch
  const imageBuffer = await image.arrayBuffer();
  const imageBlob = new Blob([imageBuffer], { type: image.type });
  
  const uploadFormData = new FormData();
  uploadFormData.append('image', imageBlob, image.name);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: uploadFormData,
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
      return {error: 'Failed to get image URL from ImgBB response.'};
    }
  } catch (error: any) {
    console.error('Error uploading image:', error);
    if (error.cause) {
      console.error('Fetch error cause:', error.cause);
      return {error: `Network error: ${error.cause}`};
    }
    return {
      error: error.message || 'An unknown error occurred during image upload.',
    };
  }
}

    