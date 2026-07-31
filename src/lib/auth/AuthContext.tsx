'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (
    email: string,
    password: string,
    recovery: {
      type: 'question' | 'code';
      question?: string;
      answer?: string;
      recoveryCode?: string;
    }
  ) => Promise<{ error?: string; recoveryCode?: string }>;
  logout: () => Promise<void>;
  recoverPassword: (
    email: string,
    newPassword: string,
    recovery: {
      type: 'question' | 'code';
      answer?: string;
      recoveryCode?: string;
    }
  ) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      router.push('/dashboard');
      return {};
    } catch (err: any) {
      return { error: err.message || 'Login failed' };
    }
  };

  const register = async (
    email: string,
    password: string,
    recovery: {
      type: 'question' | 'code';
      question?: string;
      answer?: string;
      recoveryCode?: string;
    }
  ) => {
    try {
      // Generate recovery code if Option B chosen
      let recoveryCode = recovery.recoveryCode;
      if (recovery.type === 'code' && !recoveryCode) {
        const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase();
        recoveryCode = `${rand()}-${rand()}-${rand()}-${rand()}`;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) return { error: error.message };

      if (data.user) {
        // Save recovery profile
        const profileData: any = {
          user_id: data.user.id,
          recovery_type: recovery.type,
          recovery_question: recovery.question || null,
          recovery_answer_hash: recovery.answer ? recovery.answer.trim().toLowerCase() : null,
          recovery_code_hash: recoveryCode ? recoveryCode.trim().toUpperCase() : null
        };

        await supabase.from('user_profiles').upsert(profileData);
      }

      router.push('/dashboard');
      return { recoveryCode };
    } catch (err: any) {
      return { error: err.message || 'Registration failed' };
    }
  };

  const recoverPassword = async (
    email: string,
    newPassword: string,
    recovery: {
      type: 'question' | 'code';
      answer?: string;
      recoveryCode?: string;
    }
  ) => {
    try {
      // Find profile by email /RPC or query
      const res = await fetch('/api/auth/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, recovery })
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Password recovery failed' };
      return {};
    } catch (err: any) {
      return { error: err.message || 'Password recovery failed' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, register, logout, recoverPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
