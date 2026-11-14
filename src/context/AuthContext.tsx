import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserProfile, LoginFormData, RegisterFormData } from '../types/auth';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (data: LoginFormData) => Promise<{ error?: string }>;
  signUp: (data: RegisterFormData) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  pauseAccount: (days: number) => Promise<void>;
  deleteAccountAndAllData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let authListener: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      if (isSupabaseConfigured() && supabase) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            let avatarUrl = session.user.user_metadata?.avatar_url;
            if (!avatarUrl) {
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('avatar_url')
                .eq('id', session.user.id)
                .maybeSingle();
              if (profile?.avatar_url) {
                avatarUrl = profile.avatar_url;
              }
            }

            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name:
                session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              avatar_url: avatarUrl,
              created_at: session.user.created_at,
            });
          }

          const {
            data: { subscription },
          } = supabase!.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              let avatarUrl = session.user.user_metadata?.avatar_url;
              if (!avatarUrl) {
                const { data: profile } = await supabase!
                  .from('user_profiles')
                  .select('avatar_url')
                  .eq('id', session.user.id)
                  .maybeSingle();
                if (profile?.avatar_url) {
                  avatarUrl = profile.avatar_url;
                }
              }

              setUser({
                id: session.user.id,
                email: session.user.email || '',
                full_name:
                  session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                avatar_url: avatarUrl,
                created_at: session.user.created_at,
              });
            } else {
              setUser(null);
            }
            setLoading(false);
          });

          authListener = subscription;
        } catch (err) {
          console.error('Supabase auth error:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  const signIn = async (data: LoginFormData): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        error: 'Authentication service is currently unavailable. Please try again later.',
      };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'Login failed' };
    }
  };

  const signUp = async (data: RegisterFormData): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        error: 'Authentication service is currently unavailable. Please try again later.',
      };
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'Registration failed' };
    }
  };

  const signOut = async (): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const updateAvatar = async (avatarUrl: string): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.updateUser({
          data: { avatar_url: avatarUrl },
        });
        if (user?.id) {
          await supabase
            .from('user_profiles')
            .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
            .eq('id', user.id);
        }
      } catch (err) {
        console.error('Failed to update avatar in Supabase:', err);
      }
    }
    setUser((prev) => (prev ? { ...prev, avatar_url: avatarUrl } : null));
  };

  const pauseAccount = async (days: number): Promise<void> => {
    const pauseUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.updateUser({
          data: { account_paused_until: pauseUntil },
        });
      } catch (err) {
        console.error('Failed to pause account in Supabase:', err);
      }
    }
    await signOut();
  };

  const deleteAccountAndAllData = async (): Promise<void> => {
    if (isSupabaseConfigured() && supabase && user?.id) {
      try {
        await Promise.all([
          supabase.from('records').delete().eq('user_id', user.id),
          supabase.from('follow_ups').delete().eq('user_id', user.id),
          supabase.from('user_categories').delete().eq('user_id', user.id),
          supabase.from('user_custom_fields').delete().eq('user_id', user.id),
          supabase.from('user_work_profiles').delete().eq('user_id', user.id),
        ]);
      } catch (err) {
        console.error('Error deleting user data:', err);
      }
    }
    await signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        updateAvatar,
        pauseAccount,
        deleteAccountAndAllData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
