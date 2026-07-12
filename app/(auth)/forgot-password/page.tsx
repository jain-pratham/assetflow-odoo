'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { Loader2, ArrowLeft, Boxes } from 'lucide-react';
import api from '../../../services/api';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    try {
      await api.post('/auth/forgot-password', data);
      setIsSuccess(true);
      toast.success('Reset link sent to your email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong. Please try again.');
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Forgot password?</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {isSuccess 
            ? 'Check your email for a link to reset your password. If it doesn’t appear within a few minutes, check your spam folder.' 
            : 'No worries, we\'ll send you reset instructions.'}
        </p>
      </div>

      {!isSuccess ? (
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 mt-2 flex items-center justify-center rounded-lg text-sm font-semibold text-white bg-[#1976F3] dark:bg-[#3B82F6] hover:opacity-90 focus:outline-none disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> : null}
            Reset Password
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsSuccess(false)}
          className="w-full h-12 flex items-center justify-center rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 bg-transparent border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors"
        >
          Try another email
        </button>
      )}

      <div className="mt-8 flex justify-center">
        <Link href="/login" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to log in
        </Link>
      </div>
    </div>
  );
}
