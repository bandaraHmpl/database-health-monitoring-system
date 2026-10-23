/**
 * session.ts
 *
 * Stores the logged-in user in sessionStorage (cleared on tab/browser close)
 * so the userId survives page refreshes but NOT cross-tab contamination.
 *
 * FIX: We previously stored in localStorage which persisted across users.
 *      sessionStorage is scoped to the browser tab — when the user logs out
 *      and another user logs in, they get a clean session.
 */

import { User } from '../types';

const SESSION_KEY = 'db_health_session';

export function saveSession(user: User): void {
  // Store in sessionStorage (tab-scoped, not shared between logins)
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getStoredUser(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const user: User = JSON.parse(raw);
    // Validate that userId is present and positive
    if (!user || !user.userId || user.userId <= 0 || !user.token) {
      clearSession();
      return null;
    }
    return user;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getToken(): string | null {
  return getStoredUser()?.token ?? null;
}
