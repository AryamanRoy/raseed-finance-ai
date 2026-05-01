import { jwtDecode } from 'jwt-decode';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('auth_token');
  if (!token) return null;
  try {
    const decoded = jwtDecode<AuthTokenPayload>(token);
    return {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
}

