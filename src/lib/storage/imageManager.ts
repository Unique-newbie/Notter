import { createClient } from '@/lib/supabase/client';

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
  const { width, height, quality = 0.85, maxSizeBytes = 500 * 1024 } = options;

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
 * Uploads an image to Supabase Storage and deletes the old image file if replacing.
 */
export async function uploadAndReplaceImage(
  bucketName: 'covers' | 'avatars',
  file: File,
  oldImageUrl?: string,
  options: ImageProcessingOptions = { width: 600, height: 800, maxSizeBytes: 500 * 1024 }
): Promise<string> {
  const supabase = createClient();
  const compressed = await compressAndResizeImage(file, options);

  // Fallback to DataURL if Supabase session is offline or storage fails
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return compressed.dataUrl;

    const fileExt = compressed.dataUrl.startsWith('data:image/webp') ? 'webp' : 'jpg';
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from(bucketName)
      .upload(fileName, compressed.blob, {
        contentType: compressed.dataUrl.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg',
        upsert: true
      });

    if (uploadErr || !uploadData) {
      console.warn(`[Supabase Storage] Upload fallback to DataURL:`, uploadErr?.message);
      return compressed.dataUrl;
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);
    const newPublicUrl = publicUrlData.publicUrl;

    // Delete old image file from Supabase Storage if present
    if (oldImageUrl && oldImageUrl.includes(bucketName)) {
      try {
        const parts = oldImageUrl.split(`${bucketName}/`);
        if (parts.length > 1) {
          const oldPath = parts[1];
          await supabase.storage.from(bucketName).remove([oldPath]);
        }
      } catch (cleanupErr) {
        console.warn(`[Supabase Storage] Old image cleanup note:`, cleanupErr);
      }
    }

    return newPublicUrl;
  } catch (err) {
    console.warn(`[Supabase Storage] Exception fallback to DataURL:`, err);
    return compressed.dataUrl;
  }
}
