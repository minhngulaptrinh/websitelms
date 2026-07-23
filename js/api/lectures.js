import { supabase } from '../supabaseClient.js';

export async function listLectures(classId) {
  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createLecture(payload) {
  const { error } = await supabase.from('lectures').insert({
    class_id: payload.classId,
    title: payload.title.trim(),
    content_type: payload.contentType,
    file_url: payload.fileUrl.trim(),
  });
  if (error) throw error;
}

export async function deleteLecture(lectureId) {
  const { error } = await supabase.from('lectures').delete().eq('id', lectureId);
  if (error) throw error;
}
