export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'CANDIDATE' | 'EMPLOYER' | 'ADMIN' | null;
  phone: string | null;
  image: string | null;
  createdAt?: string;
}

export interface AuthSession {
  user: AuthUser;
}

const AUTH_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${AUTH_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();
  return { user: data.user };
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  role: 'CANDIDATE' | 'EMPLOYER' = 'CANDIDATE',
): Promise<void> {
  const response = await fetch(`${AUTH_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(error.message || 'Registration failed');
  }
}

export async function signOut(): Promise<void> {
  await fetch(`${AUTH_URL}/api/auth/sign-out`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const response = await fetch(`${AUTH_URL}/api/auth/get-session`, {
      credentials: 'include',
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data?.user) return null;

    return { user: data.user };
  } catch {
    return null;
  }
}

export async function getUserProfile(): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${AUTH_URL}/api/v1/auth/me`, {
      credentials: 'include',
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.data?.user || null;
  } catch {
    return null;
  }
}
