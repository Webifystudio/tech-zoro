'use server';

export async function uploadImage(formData: FormData): Promise<{ url: string; error?: undefined } | { error: string; url?: undefined }> {
  const apiKey = '2bb2346a6a907388d8a3b0beac2bca86';
  const image = formData.get('image');

  if (!image) {
    return { error: 'No image file provided.' };
  }

  const uploadFormData = new FormData();
  uploadFormData.append('image', image);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: uploadFormData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('ImgBB upload failed:', errorText);
        return { error: `Image upload failed: ${response.statusText}` };
    }

    const result = await response.json();

    if (result.data?.url) {
      return { url: result.data.url };
    } else {
      console.error('ImgBB upload error response:', result);
      return { error: 'Failed to get image URL from ImgBB response.' };
    }
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return { error: error.message || 'An unknown error occurred during image upload.' };
  }
}
