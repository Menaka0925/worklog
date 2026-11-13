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
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name:
                session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              created_at: session.user.created_at,
            });
          }

          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                full_name:
                  session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
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
