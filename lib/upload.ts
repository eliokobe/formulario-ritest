// File upload utility using base64 conversion for Airtable
// Converts files to base64 format that Airtable can accept directly
// Compresses images to reduce payload size

export async function uploadFile(file: File): Promise<{ url: string; filename: string }> {
  if (file.type === 'application/pdf') {
    const base64 = await fileToBase64(file);
    return {
      url: base64,
      filename: file.name,
    };
  }

  return compressImage(file);
}

export async function uploadFiles(files: File[]): Promise<Array<{ url: string; filename: string }>> {
  const uploadPromises = files.map(file => uploadFile(file));
  return Promise.all(uploadPromises);
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

async function compressImage(file: File): Promise<{ url: string; filename: string }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const maxSize = 800;
      let { width, height } = img;

      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height >= width && height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

      resolve({
        url: compressedBase64,
        filename: file.name.replace(/\.[^/.]+$/, '.jpg'),
      });
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));

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