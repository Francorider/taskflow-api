import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onUnauthorized, tokenStore } from '../api/client';
import { authApi } from '../api/endpoints';
import type { AuthResponse } from '../api/types';
import { AuthContext, type AuthContextValue, type AuthState } from './context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>(() =>
    tokenStore.get() ? { status: 'loading', user: null } : { status: 'anonymous', user: null },
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    queryClient.clear();
    setState({ status: 'anonymous', user: null });
  }, [queryClient]);

  // Restore the session from a stored token on first load.
  useEffect(() => {
    if (state.status !== 'loading') return;
    authApi.me().then(
      (user) => {
        setState({ status: 'authenticated', user });
      },
      () => {
        logout();
      },
    );
  }, [state.status, logout]);

  useEffect(() => {
    onUnauthorized(logout);
    return () => {
      onUnauthorized(undefined);
    };
  }, [logout]);

  const value = useMemo<AuthContextValue>(() => {
    const signIn = ({ token, user }: AuthResponse) => {
      tokenStore.set(token);
      setState({ status: 'authenticated', user });
    };
    return {
      ...state,
      login: async (email, password) => {
        signIn(await authApi.login(email, password));
      },
      register: async (name, email, password) => {
        signIn(await authApi.register(name, email, password));
      },
      logout,
    };
  }, [state, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
