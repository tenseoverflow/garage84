/**
 * Cloudflare R2 Upload Utility
 * Simple client-side image handling for R2 bucket
 * Images are stored in Firestore as base64 or external URLs
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/**
 * Validate image file before upload
 * @param {File} file - File to validate
 * @returns {{valid: boolean, error?: string}}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: "Fail puudub" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Lubatud on ainult JPG, PNG ja WebP failid",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Faili suurus ei tohi ületada ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

/**
 * Convert image to base64 for temporary storage or preview
 * @param {File} file - File to convert
 * @returns {Promise<string>} Base64 data URL
 */
export async function convertToBase64(file) {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Viga faili lugemisel"));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload image to Cloudflare R2 via Worker
 * @param {File} file - File to upload
 * @returns {Promise<string>} Public R2 URL of uploaded image
 */
export async function uploadImageToR2(file) {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  console.log("Starting upload to R2...", {
    name: file.name,
    type: file.type,
  });

  try {
    // Upload directly to Cloudflare Worker
    const response = await fetch(
      "https://broken-cell-ff16.tense.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      }
    );

    console.log("Upload response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload failed:", errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("Upload result:", result);

    if (result.success && result.url) {
      console.log("Upload successful! URL:", result.url);
      return result.url;
    } else {
      throw new Error(result.error || "Upload failed");
    }
  } catch (error) {
    console.error("R2 upload error:", error);
    throw new Error(`Viga R2 üleslaadmisel: ${error.message}`);
  }
}

/**
 * Create image preview for user feedback
 * @param {File} file - Image file
 * @returns {Promise<string>} Data URL for preview
 */
export function createImagePreview(file) {
  return convertToBase64(file);
}
