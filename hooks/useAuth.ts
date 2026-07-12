import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, store } from '../store/store';
import { setCredentials, logout } from '../store/authSlice';
import api from '../services/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data.data);

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, accessToken } = useSelector((state: RootState) => state.auth);
  const [isInitializing, setIsInitializing] = useState(true);

  const { data, error, mutate } = useSWR(
    !isAuthenticated ? '/auth/me' : null, // fetch if we don't have the user profile
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (data && !isAuthenticated) {
      // Data contains the user, but we don't have the token here (it's in cookie, interceptor manages refresh).
      // Wait, /auth/me just returns user. The refresh token logic happens automatically in interceptor.
      // But we need the new access token to put in Redux. Let's just rely on the interceptor to get it,
      // and here we just set the user. Wait, actually if we hit /auth/me on page load, and the interceptor
      // refreshes the token, the interceptor dispatches updateAccessToken.
      // So here we just set the user.
      dispatch(setCredentials({ user: data, accessToken: store.getState().auth.accessToken || '' }));
      setIsInitializing(false);
    } else if (error) {
      dispatch(logout());
      setIsInitializing(false);
    } else if (isAuthenticated) {
      setIsInitializing(false);
    }
  }, [data, error, dispatch, isAuthenticated]);

  return {
    user,
    isAuthenticated,
    isInitializing,
    mutate,
  };
};
