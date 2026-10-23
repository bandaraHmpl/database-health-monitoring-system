/**
 * api.ts
 *
 * Central HTTP helper. Authentication is done with a JWT: the backend returns
 * a token at login, and every request sends it as "Authorization: Bearer ...".
 * The backend reads the user id from the token, so the userId is NOT sent in
 * the URL any more.
 *
 * (The optional userId parameters are kept so existing callers still compile;
 * they are ignored.)
 */

import { clearSession, getToken } from './session';

export const BASE_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export function apiUrl(path: string, _userId?: number): string {
  return `${BASE_URL}${path}`;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  _userId?: number
): Promise<Response> {
  const token = getToken();
  if (!token) {
    window.dispatchEvent(new Event('auth-expired'));
    throw new Error('Not authenticated');
  }

  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    clearSession();
    window.dispatchEvent(new Event('auth-expired'));
  }

  return res;
}

/** Download a file through the API (browsers can't attach the token to window.open). */
export async function downloadFile(path: string, fileName: string): Promise<void> {
  const res = await apiFetch(path);
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
