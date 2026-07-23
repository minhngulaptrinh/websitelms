import { supabase } from '../supabaseClient.js';

export async function createUser(actorId, payload) {
  const { data, error } = await supabase.rpc('app_create_user', {
    p_actor: actorId,
    p_email: payload.email.trim(),
    p_password: payload.password,
    p_role: payload.role,
    p_name: payload.name.trim(),
  });
  if (error) throw error;
  return data && data[0];
}

export async function listUsers(actorId, role) {
  const { data, error } = await supabase.rpc('app_list_users', {
    p_actor: actorId,
    p_role: role || null,
  });
  if (error) throw error;
  return data || [];
}

export async function deleteUser(actorId, targetId) {
  const { error } = await supabase.rpc('app_delete_user', {
    p_actor: actorId,
    p_target: targetId,
  });
  if (error) throw error;
}

export async function resetPassword(actorId, targetId, newPassword) {
  const { error } = await supabase.rpc('app_reset_password', {
    p_actor: actorId,
    p_target: targetId,
    p_password: newPassword,
  });
  if (error) throw error;
}

export async function getDirectory() {
  const { data, error } = await supabase.from('directory').select('id, name, role');
  if (error) throw error;
  const map = new Map();
  (data || []).forEach((u) => map.set(u.id, u));
  return map;
}
