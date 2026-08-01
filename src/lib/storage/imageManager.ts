import { indexedDBAdapter } from '@/lib/storage/indexedDBAdapter';

export interface ImageProcessingOptions {
  width: number;
  height: number;
  quality?: number;
  maxSizeBytes?: number;
}

/**
 * Resizes an image file to exact width x height aspect ratio and compresses to WebP DataURL or Blob.
 */
export async function compressAndResizeImage(
  file: File,
  options: ImageProcessingOptions
): Promise<{ dataUrl: string; blob: Blob; sizeBytes: number }> {
  const { width, height, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file must be an image (PNG, JPG, WebP, GIF).'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image element.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) return reject(new Error('Canvas 2D context unavailable.'));

        // Center cover-crop calculation
        const scale = Math.max(width / img.width, height / img.height);
        const x = (width - img.width * scale) / 2;
        const y = (height - img.height * scale) / 2;

        ctx.fillStyle = '#121218';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Convert to WebP format with quality fallback
        let currentQuality = quality;
        let dataUrl = canvas.toDataURL('image/webp', currentQuality);

        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Failed to create image blob.'));
            resolve({
              dataUrl,
              blob,
              sizeBytes: blob.size
            });
          },
          dataUrl.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg',
          currentQuality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads/Saves an image to IndexedDB Blob storage and cleans up old image Blobs.
 */
export async function uploadAndReplaceImage(
  bucketName: 'covers' | 'avatars',
  file: File,
  oldImageUrl?: string,
  options: ImageProcessingOptions = { width: 600, height: 800, maxSizeBytes: 500 * 1024 }
): Promise<string> {
  const compressed = await compressAndResizeImage(file, options);
  const blobId = `${bucketName}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  try {
    await indexedDBAdapter.saveBlob(blobId, compressed.blob);

    // Delete old blob if replacing
    if (oldImageUrl && oldImageUrl.startsWith('blob_')) {
      await indexedDBAdapter.delete('blobs', oldImageUrl);
    }

    return compressed.dataUrl;
  } catch (e) {
    console.warn('[ImageManager] IndexedDB blob save fallback to DataURL:', e);
    return compressed.dataUrl;
  }
}

/**
 * Safely removes an image from local Blob storage.
 */
export async function removeStorageImage(bucketName: 'covers' | 'avatars', imageId?: string): Promise<boolean> {
  if (!imageId) return true;
  try {
    return await indexedDBAdapter.delete('blobs', imageId);
  } catch (e) {
    return false;
  }
}
