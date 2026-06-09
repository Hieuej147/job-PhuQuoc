export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'CANDIDATE' | 'EMPLOYER' | 'ADMIN';
  image?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
