export const SUPABASE_URL = 'https://efsmtbthriabnbicazqv.supabase.co';

export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmc210YnRocmlhYm5iaWNhenF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTQ0MTYsImV4cCI6MjEwMDAzMDQxNn0.8F_r7CgArIirc4Ci2_gOoFuweuqhV8r-61Ib1x_3yMI';

export const STORAGE_BUCKET = 'lms-files';

export const MAX_UPLOAD_MB = 50;

export function isConfigured() {
  return (
    SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_URL.includes('YOUR-PROJECT-REF') &&
    SUPABASE_ANON_KEY.length > 20 &&
    !SUPABASE_ANON_KEY.includes('YOUR-ANON')
  );
}
