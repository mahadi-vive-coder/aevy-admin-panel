import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { AdminUser } from '../types';

interface AuthDiagnostics {
  authUid: string | null;
  userEmail: string | null;
  profileId: string | null;
  profileRole: string | null;
  isSessionActive: boolean;
  hasAdminPrivileges: boolean;
  lastCheckedAt: string | null;
}

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  error: string | null;
  diagnostics: AuthDiagnostics;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  isSupabaseAuthConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSupabaseAuthConnected, setIsSupabaseAuthConnected] = useState<boolean>(false);
  const [diagnostics, setDiagnostics] = useState<AuthDiagnostics>({
    authUid: null,
    userEmail: null,
    profileId: null,
    profileRole: null,
    isSessionActive: false,
    hasAdminPrivileges: false,
    lastCheckedAt: null,
  });

  const verifyUserSession = async (sessionUser: any) => {
    if (!sessionUser) {
      setUser(null);
      setDiagnostics({
        authUid: null,
        userEmail: null,
        profileId: null,
        profileRole: null,
        isSessionActive: false,
        hasAdminPrivileges: false,
        lastCheckedAt: new Date().toISOString(),
      });
      return false;
    }

    const supabase = getSupabase();
    if (!supabase) return false;

    const uid = sessionUser.id;
    const email = sessionUser.email || '';

    try {
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', uid)
        .maybeSingle();

      const pId = profile?.id || null;
      const pRole = profile?.role || null;
      const isAdmin = pRole === 'admin';

      setDiagnostics({
        authUid: uid,
        userEmail: email,
        profileId: pId,
        profileRole: pRole,
        isSessionActive: true,
        hasAdminPrivileges: isAdmin,
        lastCheckedAt: new Date().toISOString(),
      });

      if (profileErr) {
        console.warn('Profile fetch query error:', profileErr.message);
      }

      if (isAdmin) {
        setUser({
          id: uid,
          email,
          role: 'admin',
          full_name: profile?.full_name || 'AEVY Administrator',
          last_sign_in_at: sessionUser.last_sign_in_at,
        });
        return true;
      } else {
        // Not admin in profiles table
        setUser(null);
        setError(
          pRole
            ? `Access Denied: Account is signed in (${email}), but has role '${pRole}' instead of 'admin' in public.profiles.`
            : `Access Denied: No matching row found in public.profiles for UID ${uid}.`
        );
        return false;
      }
    } catch (err: any) {
      console.error('Session verification error:', err);
      setUser(null);
      return false;
    }
  };

  const checkSession = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setIsSupabaseAuthConnected(false);
      setIsLoading(false);
      return;
    }

    setIsSupabaseAuthConnected(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await verifyUserSession(session?.user || null);
    } catch (err) {
      console.warn('Supabase getSession error:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();

    const supabase = getSupabase();
    if (!supabase) return;

    // Listen to real-time auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          await verifyUserSession(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setDiagnostics({
          authUid: null,
          userEmail: null,
          profileId: null,
          profileRole: null,
          isSessionActive: false,
          hasAdminPrivileges: false,
          lastCheckedAt: new Date().toISOString(),
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);
    const supabase = getSupabase();

    if (!supabase) {
      const err = 'Supabase client is not configured. Please check your project settings.';
      setError(err);
      setIsLoading(false);
      return { success: false, error: err };
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return { success: false, error: authError.message };
      }

      if (data.user) {
        const verified = await verifyUserSession(data.user);
        setIsLoading(false);
        if (verified) {
          return { success: true };
        } else {
          return {
            success: false,
            error:
              'Authenticated with Supabase, but this account is not assigned role = "admin" in public.profiles.',
          };
        }
      }

      setIsLoading(false);
      return { success: false, error: 'Authentication failed. Please try again.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown sign-in exception';
      console.error('Sign in exception:', err);
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase sign out error:', e);
      }
    }
    setUser(null);
    setDiagnostics({
      authUid: null,
      userEmail: null,
      profileId: null,
      profileRole: null,
      isSessionActive: false,
      hasAdminPrivileges: false,
      lastCheckedAt: new Date().toISOString(),
    });
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        diagnostics,
        signIn,
        signOut,
        checkSession,
        isSupabaseAuthConnected,
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

