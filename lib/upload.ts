// File upload utility using base64 conversion for Airtable
// Converts files to base64 format that Airtable can accept directly
// Compresses images to reduce payload size

export async function uploadFile(file: File): Promise<{ url: string; filename: string }> {
  return new Promise((resolve, reject) => {
    // Create canvas for image compression
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions (max 800px on longest side)
      const maxSize = 800;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      // Set canvas dimensions and draw compressed image
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression (0.7 quality)
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
      
      resolve({
        url: compressedBase64,
        filename: file.name.replace(/\.[^/.]+$/, '.jpg'), // Change extension to jpg
      });
    };
    
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    
    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function uploadFiles(files: File[]): Promise<Array<{ url: string; filename: string }>> {
  const uploadPromises = files.map(file => uploadFile(file));
  return Promise.all(uploadPromises);
}