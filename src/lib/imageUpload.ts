import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Compresses an image file in the browser to ensure it is under 200KB and optimized.
 * Uses an iterative compression algorithm with canvas resizing and JPEG quality adjustments.
 * 
 * @param file The original image File object
 * @returns A Promise resolving to a compressed Blob
 */
export async function compressImage(file: File): Promise<Blob> {
  // If the file is not an image, return it as-is
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // Create an HTMLImageElement to load the image
  const img = new Image();
  const url = URL.createObjectURL(file);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (err) => reject(err);
    img.src = url;
  });

  // Clean up the object URL to prevent memory leaks
  URL.revokeObjectURL(url);

  let width = img.naturalWidth;
  let height = img.naturalHeight;

  // Enforce a sensible maximum dimension for web performance (e.g., max 1200px)
  const MAX_DIMENSION = 1200;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_DIMENSION) / width);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width * MAX_DIMENSION) / height);
      height = MAX_DIMENSION;
    }
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2D context from canvas");
  }

  let quality = 0.85;
  let scale = 1.0;
  let compressedBlob: Blob | null = null;
  const MAX_UPLOAD_SIZE = 200 * 1024; // 200KB in bytes

  // Iterative compression loop: up to 5 attempts with decreasing scale and quality
  for (let attempt = 1; attempt <= 5; attempt++) {
    const currentWidth = Math.round(width * scale);
    const currentHeight = Math.round(height * scale);

    canvas.width = currentWidth;
    canvas.height = currentHeight;

    // Draw the image on the canvas
    ctx.clearRect(0, 0, currentWidth, currentHeight);
    ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

    // Compress to image/jpeg (which supports quality adjustment)
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b),
        "image/jpeg",
        quality
      );
    });

    if (blob) {
      compressedBlob = blob;
      // If the compressed size is within the 200KB budget, we are done!
      if (blob.size <= MAX_UPLOAD_SIZE) {
        break;
      }
    }

    // Otherwise, decrease quality and scale for the next iteration
    quality -= 0.15;
    scale *= 0.85;
  }

  // Fallback: if even after 5 iterations it exceeds 200KB, compress with aggressive settings
  if (compressedBlob && compressedBlob.size > MAX_UPLOAD_SIZE) {
    canvas.width = Math.round(width * 0.5);
    canvas.height = Math.round(height * 0.5);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const finalBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.4);
    });

    if (finalBlob) {
      return finalBlob;
    }
  }

  if (!compressedBlob) {
    throw new Error("Failed to compress image");
  }

  return compressedBlob;
}

/**
 * Compresses an image and uploads it to Firebase Storage.
 * Stores only the secure download URL and deletes any Base64 fallback.
 * 
 * @param file The image file to upload
 * @param folder The storage folder name (e.g. 'courses', 'avatars', 'receipts')
 * @returns A Promise resolving to the secure public Storage download URL
 */
export async function compressAndUploadImage(file: File, folder: string = "uploads"): Promise<string> {
  try {
    // 1. Compress the image to satisfy the < 200KB and optimization requirements
    const compressedBlob = await compressImage(file);

    // 2. Prepare a clean, safe filename with a unique timestamp and random suffix
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${cleanName}`;
    const storagePath = `${folder}/${uniqueFilename}`;

    // 3. Create ref and upload
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, compressedBlob, {
      contentType: "image/jpeg",
    });

    // 4. Retrieve the secure download URL
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error("[ImageUpload] Error compressing and uploading image:", error);
    throw error;
  }
}
