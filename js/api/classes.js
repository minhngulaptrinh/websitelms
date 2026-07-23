import { supabase } from '../supabaseClient.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(length = 6) {
  let code = '';
  const values = crypto.getRandomValues(new Uint32Array(length));
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[values[i] % CODE_ALPHABET.length];
  }
  return code;
}

export async function createClass(teacherId, className) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = randomCode();
    const { data, error } = await supabase
      .from('classes')
      .insert({ class_name: className.trim(), class_code: code, teacher_id: teacherId })
      .select()
      .single();
    if (!error) return data;
    if (error.code !== '23505') throw error;
  }
  throw new Error('Không thể tạo mã lớp duy nhất, vui lòng thử lại.');
}

export async function listClassesByTeacher(teacherId) {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listAllClasses() {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getClass(classId) {
  const { data, error } = await supabase.from('classes').select('*').eq('id', classId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteClass(classId) {
  const { error } = await supabase.from('classes').delete().eq('id', classId);
  if (error) throw error;
}

export async function joinClassByCode(studentId, code) {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) throw new Error('Vui lòng nhập mã lớp.');
  const { data: cls, error } = await supabase
    .from('classes')
    .select('*')
    .eq('class_code', trimmed)
    .maybeSingle();
  if (error) throw error;
  if (!cls) throw new Error('Mã lớp không tồn tại. Vui lòng kiểm tra lại.');
  const { error: joinError } = await supabase
    .from('class_students')
    .insert({ class_id: cls.id, student_id: studentId });
  if (joinError) {
    if (joinError.code === '23505') throw new Error('Bạn đã tham gia lớp học này rồi.');
    throw joinError;
  }
  return cls;
}

export async function listClassesForStudent(studentId) {
  const { data, error } = await supabase
    .from('class_students')
    .select('joined_at, classes(*)')
    .eq('student_id', studentId)
    .order('joined_at', { ascending: false });
  if (error) throw error;
  return (data || []).filter((row) => row.classes).map((row) => row.classes);
}

export async function listStudentsInClass(classId) {
  const { data, error } = await supabase
    .from('class_students')
    .select('student_id, joined_at')
    .eq('class_id', classId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function countStudents(classId) {
  const { count, error } = await supabase
    .from('class_students')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', classId);
  if (error) throw error;
  return count || 0;
}

export async function removeStudent(classId, studentId) {
  const { error } = await supabase
    .from('class_students')
    .delete()
    .eq('class_id', classId)
    .eq('student_id', studentId);
  if (error) throw error;
}
