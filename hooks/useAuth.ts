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
  const [shouldFetch, setShouldFetch] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSession = localStorage.getItem('hasSession') === 'true';
      if (hasSession && !isAuthenticated) {
        setShouldFetch(true);
      } else {
        setIsInitializing(false);
      }
    }
  }, [isAuthenticated]);

  const { data, error, mutate } = useSWR(
    shouldFetch ? '/auth/me' : null,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (data && !isAuthenticated) {
      dispatch(setCredentials({ user: data, accessToken: store.getState().auth.accessToken || '' }));
      setIsInitializing(false);
    } else if (error) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hasSession');
      }
      dispatch(logout());
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
