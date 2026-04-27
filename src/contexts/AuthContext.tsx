import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, Role } from '../lib/database.types';
import type { Session } from '@supabase/supabase-js';

export type { Role };

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, fullName: string, role: Role) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function makeInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';
}

function profileToUser(p: Profile): AuthUser {
  return {
    id: p.id,
    name: p.full_name,
    email: p.email,
    role: p.role as Role,
    initials: makeInitials(p.full_name),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from database
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }
    return data as Profile;
  };

  // Initialize: check existing session
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (existingSession?.user) {
          setSession(existingSession);
          const p = await fetchProfile(existingSession.user.id);
          if (p) {
            setProfile(p);
            setUser(profileToUser(p));
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);

        if (event === 'SIGNED_IN' && newSession?.user) {
          // Small delay to let the trigger create the profile
          await new Promise(r => setTimeout(r, 500));
          const p = await fetchProfile(newSession.user.id);
          if (p) {
            setProfile(p);
            setUser(profileToUser(p));
          }
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Login
  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { error: error.message };

    if (data.user) {
      const p = await fetchProfile(data.user.id);
      if (p) {
        setProfile(p);
        setUser(profileToUser(p));
      }
    }

    return { error: null };
  };

  // Signup
  const signup = async (
    email: string,
    password: string,
    fullName: string,
    role: Role
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });

    if (error) return { error: error.message };
    return { error: null };
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
