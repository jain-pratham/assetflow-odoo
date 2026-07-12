'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff, Boxes } from 'lucide-react';
import api from '../../../services/api';

const resetSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  confirmPassword: z.string().min(8, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetForm = z.infer<typeof resetSchema>;

import { useEffect } from 'react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false);
        return;
      }
      try {
        await api.get(`/auth/verify-reset-token?resetToken=${token}`);
        setIsValidToken(true);
      } catch (error) {
        setIsValidToken(false);
      } finally {
        setIsVerifying(false);
      }
    };
    verifyToken();
  }, [token]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const passwordValue = watch('password') || '';
  const passwordRules = [
    { label: 'Minimum 8 characters', met: passwordValue.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(passwordValue) },
    { label: 'One lowercase letter', met: /[a-z]/.test(passwordValue) },
    { label: 'One number', met: /[0-9]/.test(passwordValue) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(passwordValue) },
  ];

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin w-8 h-8 text-[#1976F3] mb-4" />
        <p className="text-sm text-gray-500">Verifying secure link...</p>
      </div>
    );
  }

  if (!token || !isValidToken) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Invalid Link</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          The password reset link is invalid, has expired, or was already used.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="mt-6 w-full h-12 flex items-center justify-center rounded-lg text-sm font-semibold text-white bg-[#1976F3] dark:bg-[#3B82F6] hover:opacity-90 transition-opacity"
        >
          Return to Login
        </button>
      </div>
    );
  }

  const onSubmit = async (data: ResetForm) => {
    try {
      await api.post(`/auth/reset-password/${token}`, { password: data.password });
      toast.success('Password has been reset successfully');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password. Token may have expired.');
    }
  };

  return (
    <>
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#1976F3] rounded-full flex items-center justify-center">
             <Boxes className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">AssetFlow</span>
        </div>
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Set New Password</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Enter your new password below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
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
          <div className="mt-3 space-y-1.5">
            {passwordRules.map((rule, idx) => (
              <div key={idx} className="flex items-center text-xs">
                <div className={`w-3 h-3 rounded-full mr-2 flex-shrink-0 flex items-center justify-center ${rule.met ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {rule.met && <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className={rule.met ? 'text-gray-900 dark:text-gray-300' : 'text-gray-500'}>{rule.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
          <div className="relative">
            <input
              {...register('confirmPassword')}
              type={showConfirm ? 'text' : 'password'}
              className="w-full h-12 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-blue-50/50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#1976F3] dark:focus:border-[#3B82F6] transition-colors pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-sm text-red-500 mt-1.5">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 mt-2 flex items-center justify-center rounded-lg text-sm font-semibold text-white bg-[#1976F3] dark:bg-[#3B82F6] hover:opacity-90 focus:outline-none disabled:opacity-50 transition-opacity"
        >
          {isSubmitting ? <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> : null}
          Reset Password
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-[420px] p-8 bg-white dark:bg-[#1F2937] rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-800">
      <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-[#1976F3]" /></div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
