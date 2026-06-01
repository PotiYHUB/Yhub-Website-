/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Compresses and resizes an image file client-side for web optimization.
 * Returns a Blob of the compressed image (preferring image/webp, falling back to image/jpeg).
 */
export function optimizeImageForWeb(
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.70
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // If the file is not an image, reject
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions preserving aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get 2D context from canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP (or fallback to JPEG if WebP isn't fully supported or empty)
        let mimeType = 'image/webp';
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              // Fallback to jpeg
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) {
                    resolve(jpegBlob);
                  } else {
                    reject(new Error('Canvas compression failed'));
                  }
                },
                'image/jpeg',
                quality
              );
            }
          },
          mimeType,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image into element'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a Blob to a Base64 string.
 */
export function blobToBase64(blob: Blob | File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Conversion to base64 failed'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
