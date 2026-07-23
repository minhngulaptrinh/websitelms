import { supabase } from '../supabaseClient.js';

export async function submitQuiz(quizId, studentId, answers) {
  const { data, error } = await supabase.rpc('submit_quiz', {
    p_quiz: quizId,
    p_student: studentId,
    p_answers: answers,
  });
  if (error) throw error;
  return data && data[0];
}

export async function listSubmissionsByQuiz(quizId) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listSubmissionsByStudent(studentId, quizIds) {
  if (!quizIds || quizIds.length === 0) return [];
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('student_id', studentId)
    .in('quiz_id', quizIds)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
