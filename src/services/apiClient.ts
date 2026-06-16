const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

let accessToken: string | null = localStorage.getItem('la_access_token');

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (token) localStorage.setItem('la_access_token', token);
  else localStorage.removeItem('la_access_token');
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function refreshTokens(): Promise<boolean> {
  try {
    // Prefer httpOnly cookie (sent automatically via credentials:include).
    // Fall back to localStorage-stored token for environments where cookies are blocked.
    const storedRefresh = localStorage.getItem('la_refresh_token');
    const body = storedRefresh ? JSON.stringify({ refreshToken: storedRefresh }) : undefined;
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...(body ? { body } : {}),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.data.accessToken);
    if (data.data.refreshToken) localStorage.setItem('la_refresh_token', data.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (res.status === 401 && retry) {
    const ok = await refreshTokens();
    if (ok) return apiFetch<T>(path, options, false);
    setAccessToken(null);
    window.dispatchEvent(new Event('la:session-expired'));
    throw new Error('Session expired');
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.message ?? `HTTP ${res.status}`);
  }

  return json as T;
}

export const api = {
  get:    <T>(path: string) => apiFetch<T>(path),
  post:   <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'PUT',   body: JSON.stringify(body) }),
  delete: <T>(path: string)               => apiFetch<T>(path, { method: 'DELETE' }),
};
