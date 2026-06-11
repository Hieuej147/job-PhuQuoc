export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'CANDIDATE' | 'EMPLOYER' | 'ADMIN' | null;
  phone: string | null;
  image: string | null;
  emailVerified: boolean;
  createdAt?: string;
}

export interface AuthSession {
  user: AuthUser;
}

export type PasswordResetRequestResult =
  | {
      status: "RESET_OTP_SENT";
      email: string;
    }
  | {
      status: "VERIFY_EMAIL_REQUIRED";
      email: string;
    }
  | {
      status: "OAUTH_ONLY";
      email: string;
    }
  | {
      status: "EMAIL_NOT_FOUND";
      email: string;
    };

export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const response = await authFetch('/api/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();
  return { user: data.user };
}

export async function signOut(): Promise<void> {
  await authFetch('/api/auth/sign-out', { method: 'POST' });
}

export async function updateMyProfile(data: {
  name?: string;
  phone?: string;
  image?: string;
}): Promise<AuthUser | null> {
  const response = await authFetch('/api/v1/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Update failed' }));
    throw new Error(error.message || 'Update failed');
  }

  const payload = await response.json();
  return payload.data?.user || payload.user || null;
}

export async function selectMyRole(role: 'CANDIDATE' | 'EMPLOYER'): Promise<AuthUser> {
  const response = await authFetch('/api/v1/auth/select-role', {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Role selection failed' }));
    throw new Error(error.message || 'Role selection failed');
  }

  const payload = await response.json();
  return payload.data?.user || payload.user;
}

export async function getUserProfile(): Promise<AuthUser | null> {
  try {
    const response = await authFetch('/api/v1/auth/me');

    if (!response.ok) return null;

    const data = await response.json();
    return data.data?.user || data.user || null;
  } catch {
    return null;
  }
}

export async function sendVerificationOtp(email: string): Promise<void> {
  const response = await authFetch('/api/auth/email-otp/send-verification-otp', {
    method: 'POST',
    body: JSON.stringify({ email, type: 'email-verification' }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to send OTP' }));
    throw new Error(error.message || 'Failed to send OTP');
  }
}

export async function verifyEmailOtp(email: string, otp: string): Promise<void> {
  const response = await authFetch('/api/auth/email-otp/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to verify email' }));
    throw new Error(error.message || 'Failed to verify email');
  }
}

export async function requestPasswordReset(email: string): Promise<PasswordResetRequestResult> {
  const response = await authFetch('/api/v1/auth/request-password-reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to request password reset' }));
    throw new Error(error.message || 'Failed to request password reset');
  }

  return response.json();
}

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
  const response = await authFetch('/api/auth/email-otp/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, password: newPassword }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to reset password' }));
    throw new Error(error.message || 'Failed to reset password');
  }
}
