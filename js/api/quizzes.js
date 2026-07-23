import { supabase } from '../supabaseClient.js';

export async function listQuizzes(classId) {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listPublishedQuizzes(classId) {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('class_id', classId)
    .eq('is_published', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getQuiz(quizId) {
  const { data, error } = await supabase.from('quizzes').select('*').eq('id', quizId).maybeSingle();
  if (error) throw error;
  return data;
}

function optionalText(value) {
  const trimmed = (value || '').trim();
  return trimmed === '' ? null : trimmed;
}

export async function createQuizWithQuestions(classId, title, isPublished, pdfUrl, questions) {
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .insert({ class_id: classId, title: title.trim(), is_published: isPublished, pdf_url: pdfUrl || null })
    .select()
    .single();
  if (error) throw error;

  const rows = questions.map((q) => ({
    quiz_id: quiz.id,
    question_text: optionalText(q.question_text),
    option_a: optionalText(q.option_a),
    option_b: optionalText(q.option_b),
    option_c: optionalText(q.option_c),
    option_d: optionalText(q.option_d),
    correct_option: q.correct_option,
  }));
  const { error: qError } = await supabase.from('questions').insert(rows);
  if (qError) {
    await supabase.from('quizzes').delete().eq('id', quiz.id);
    throw qError;
  }
  return quiz;
}

export async function setQuizPublished(quizId, isPublished) {
  const { error } = await supabase.from('quizzes').update({ is_published: isPublished }).eq('id', quizId);
  if (error) throw error;
}

export async function deleteQuiz(quizId) {
  const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
  if (error) throw error;
}

export async function countQuestions(quizId) {
  const { count, error } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('quiz_id', quizId);
  if (error) throw error;
  return count || 0;
}

export async function getStudentQuestions(quizId) {
  const { data, error } = await supabase.rpc('student_quiz_questions', { p_quiz: quizId });
  if (error) throw error;
  return data || [];
}

export async function getTeacherQuestions(actorId, quizId) {
  const { data, error } = await supabase.rpc('app_quiz_questions', {
    p_actor: actorId,
    p_quiz: quizId,
  });
  if (error) throw error;
  return data || [];
}
