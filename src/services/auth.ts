import type { User } from '../types';
import { getUsers, saveUser, getCurrentUserId, setCurrentUserId } from './storage';

async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createAccount(
  userId: string,
  password: string,
  email?: string,
): Promise<{ success: boolean; error?: string }> {
  const id = userId.trim();
  if (id.length < 3) return { success: false, error: 'Account ID must be at least 3 characters.' };
  if (password.length < 4) return { success: false, error: 'Password must be at least 4 characters.' };

  const users = getUsers();
  if (users[id]) return { success: false, error: 'That Account ID is already taken.' };

  const user: User = {
    id,
    passwordHash: await hashPassword(password),
    email: email?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  saveUser(user);
  setCurrentUserId(id);
  return { success: true };
}

export async function login(
  userId: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  const users = getUsers();
  const user = users[userId.trim()];
  if (!user) return { success: false, error: 'No account found with that ID.' };

  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) return { success: false, error: 'Incorrect password.' };

  setCurrentUserId(user.id);
  return { success: true };
}

export function logout(): void {
  setCurrentUserId(null);
}

export function getCurrentUser(): User | null {
  const id = getCurrentUserId();
  if (!id) return null;
  return getUsers()[id] ?? null;
}
