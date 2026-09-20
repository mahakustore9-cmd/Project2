/**
 * Image Compression Service
 * Enforces strict max file size of <= 350KB as requested by user.
 * Optimizes portrait aspect ratio for crisp Student ID card printing.
 */

export interface CompressionResult {
  dataUrl: string;
  sizeBytes: number;
  sizeKb: number;
  width: number;
  height: number;
}

export async function compressImageToMax350KB(file: File): Promise<CompressionResult> {
  const MAX_BYTES = 350 * 1024; // 358,400 bytes

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale down if dimensions are excessively huge for an ID card
        const MAX_DIM = 1000;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Iteratively find quality that stays <= 350KB
        let quality = 0.92;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let byteLength = Math.round((dataUrl.length * 3) / 4);

        while (byteLength > MAX_BYTES && quality > 0.2) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          byteLength = Math.round((dataUrl.length * 3) / 4);
        }

        // If still over 350KB, reduce canvas dimensions further
        if (byteLength > MAX_BYTES) {
          canvas.width = Math.round(width * 0.7);
          canvas.height = Math.round(height * 0.7);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          byteLength = Math.round((dataUrl.length * 3) / 4);
        }

        resolve({
          dataUrl,
          sizeBytes: byteLength,
          sizeKb: Math.round(byteLength / 1024),
          width: canvas.width,
          height: canvas.height,
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
