import { supabase } from './supabaseClient.js';

const SESSION_KEY = 'lms_session_user';

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function login(email, password) {
  const { data, error } = await supabase.rpc('app_login', {
    p_email: email.trim(),
    p_password: password,
  });
  if (error) throw error;
  const user = data && data[0];
  if (!user) {
    throw new Error('Email hoặc mật khẩu không chính xác.');
  }
  setSession(user);
  return user;
}

export function logout() {
  clearSession();
  window.location.hash = '#/login';
}

export function homeRouteFor(role) {
  if (role === 'admin') return '#/admin';
  if (role === 'teacher') return '#/teacher';
  return '#/student';
}
