export interface WorkProfile {
  industry?: string;
  job_role?: string;
  work_type?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  work_profile?: WorkProfile;
  created_at?: string;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
