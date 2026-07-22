'use server';

import { supabase } from '../supabaseClient';
import { login, logout } from '../auth';

export async function loginAdmin(password: string) {
  const masterPassword = process.env.ADMIN_MASTER_PASSWORD || 'pedroluna2024'; // Fallback for dev

  if (password === masterPassword) {
    await login({ id: 'admin-id', role: 'admin', name: 'Pedro Luna' });
    return { success: true };
  }
  
  return { success: false, error: 'Contraseña incorrecta' };
}

export async function loginClient(clientPassword: string) {
  // Buscamos un perfil con esa contraseña
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('client_password', clientPassword)
    .single();

  if (error || !data) {
    return { success: false, error: 'Código de cliente no encontrado' };
  }

  await login({ id: data.id, role: 'client', name: data.full_name });
  return { success: true };
}

export async function logoutUser() {
  await logout();
}
