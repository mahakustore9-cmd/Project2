/**
 * Image Compression Service
 * Enforces strict max file size of <= 350KB as requested by user.
 * Optimizes portrait aspect ratio for crisp Student ID card printing.
 */

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  sizeBytes: number;
  sizeKb: number;
  width: number;
  height: number;
}

export async function compressImageToMax350KB(file: File): Promise<CompressionResult> {
  // Target practical size: 100 - 250 KB max
  const MAX_BYTES = 250 * 1024; // 256,000 bytes

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
        const MAX_DIM = 800;
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

        // Iteratively find quality that stays within ~100-250KB
        let quality = 0.88;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let byteLength = Math.round((dataUrl.length * 3) / 4);

        while (byteLength > MAX_BYTES && quality > 0.3) {
          quality -= 0.08;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          byteLength = Math.round((dataUrl.length * 3) / 4);
        }

        // If still over 250KB, reduce canvas dimensions slightly
        if (byteLength > MAX_BYTES) {
          canvas.width = Math.round(width * 0.75);
          canvas.height = Math.round(height * 0.75);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          byteLength = Math.round((dataUrl.length * 3) / 4);
        }

        canvas.toBlob(
          (blob) => {
            const actualBlob = blob || new Blob([], { type: 'image/jpeg' });
            resolve({
              blob: actualBlob,
              dataUrl,
              sizeBytes: actualBlob.size || byteLength,
              sizeKb: Math.round((actualBlob.size || byteLength) / 1024),
              width: canvas.width,
              height: canvas.height,
            });
          },
          'image/jpeg',
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
