import { supabase } from './supabaseClient.js';
import { STORAGE_BUCKET, MAX_UPLOAD_MB } from './config.js';

export async function uploadFile(file, folder) {
  if (!file) throw new Error('Chưa chọn tệp.');
  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > MAX_UPLOAD_MB) {
    throw new Error(`Tệp vượt quá giới hạn ${MAX_UPLOAD_MB}MB.`);
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
