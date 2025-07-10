
'use server';

export async function uploadImage(
  base64Image: string
): Promise<{url: string; error?: undefined} | {error: string; url?: undefined}> {
  const apiKey = '2bb2346a6a907388d8a3b0beac2bca86';
  
  // Remove the data URI prefix if it exists
  const base64Data = base64Image.split(',')[1] || base64Image;

  const formData = new FormData();
  formData.append('image', base64Data);

  try {
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
