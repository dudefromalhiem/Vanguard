import { getDb } from './db.js';

const BUCKET_NAME = 'uploads';

/**
 * Upload a file to Supabase Storage.
 * @param {Buffer|Blob} fileData - The file data
 * @param {string} fileName - Desired file name (will be placed under folder)
 * @param {string} folder - Subfolder (e.g. 'gallery', 'news', 'resources')
 * @param {string} contentType - MIME type
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadFile(fileData, fileName, folder, contentType) {
  const db = getDb();
  const path = `${folder}/${Date.now()}-${fileName}`;

  const { error } = await db.storage
    .from(BUCKET_NAME)
    .upload(path, fileData, {
      contentType,
      upsert: false
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = db.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return { url: urlData.publicUrl, path };
}

/**
 * Delete a file from Supabase Storage.
 * @param {string} path - Storage path of the file
 */
export async function deleteFile(path) {
  const db = getDb();
  const { error } = await db.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) throw new Error(`Delete failed: ${error.message}`);
}

/**
 * List files in a folder.
 * @param {string} folder - Subfolder to list
 */
export async function listFiles(folder) {
  const db = getDb();
  const { data, error } = await db.storage
    .from(BUCKET_NAME)
    .list(folder, { sortBy: { column: 'created_at', order: 'desc' } });

  if (error) throw new Error(`List failed: ${error.message}`);
  return data;
}
