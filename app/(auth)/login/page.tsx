'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Boxes } from 'lucide-react';
import api from '../../../services/api';
import { setCredentials } from '../../../store/authSlice';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await api.post('/auth/login', data);
      const { user, accessToken } = res.data.data;
      dispatch(setCredentials({ user, accessToken }));
      if (typeof window !== 'undefined') {
        localStorage.setItem('hasSession', 'true');
      }
      toast.success('Logged in successfully');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-[420px] p-8 bg-white dark:bg-[#1F2937] rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-800">
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#1976F3] rounded-full flex items-center justify-center">
             <Boxes className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">AssetFlow</span>
        </div>
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome Back</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Enter Details Below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
          <input
            {...register('email')}
            type="email"
            className="w-full h-12 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-blue-50/50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#1976F3] dark:focus:border-[#3B82F6] transition-colors"
            placeholder="name@example.com"
          />
          {errors.email && <p className="text-sm text-red-500 mt-1.5">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              className="w-full h-12 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-blue-50/50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#1976F3] dark:focus:border-[#3B82F6] transition-colors pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-500 mt-1.5">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 rounded border-gray-300 text-[#1976F3] focus:ring-[#1976F3] dark:border-gray-700 dark:bg-gray-800"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-600 dark:text-gray-300">
              Remember me
            </label>
          </div>
          <Link href="/forgot-password" className="text-sm text-[#1976F3] dark:text-[#3B82F6] hover:opacity-80 font-medium">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 mt-2 flex items-center justify-center rounded-lg text-sm font-semibold text-white bg-[#1976F3] dark:bg-[#3B82F6] hover:opacity-90 focus:outline-none disabled:opacity-50 transition-opacity"
        >
          {isSubmitting ? <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> : null}
          Get Started
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link href="/signup" className="font-medium text-[#1976F3] dark:text-[#3B82F6] hover:opacity-80">
          Sign up
        </Link>
      </p>
    </div>
  );
}
