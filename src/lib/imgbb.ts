
'use server';

const ZORO_FALLBACK_IMGBB_API_KEY = "cebcb7546aca25ed5c92ab3ff6491b1c";

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
  base64Image: string
): Promise<{url: string; error?: undefined} | {error: string; url?: undefined}> {
  try {
    const formData = new FormData();
    // The image needs to be sent as base64 string without the data URI prefix
    formData.append('image', base64Image.split(',')[1]);


    const response = await fetch(`https://api.imgbb.com/1/upload?key=${ZORO_FALLBACK_IMGBB_API_KEY}`, {
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
