export interface WorkProfile {
  full_name?: string;
  email?: string;
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

export type AccountActivityEventType =
  | 'password_changed'
  | 'password_reset'
  | 'account_paused'
  | 'account_resumed';

export interface AccountActivityRecord {
  id: string;
  user_id: string;
  event_type: AccountActivityEventType;
  event_timestamp: string;
  metadata?: {
    method?: string;
    pause_days?: number;
    start_date?: string;
    expected_resume_date?: string;
    resumed_at?: string;
    early_resume?: boolean;
    backfilled?: boolean;
    [key: string]: any;
  };
  created_at: string;
}
