import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { loginSchema } from '@sweety/shared/schemas/auth.schema.js';
import { useLogin } from '../hooks/useLogin.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { EyeIcon, EyeOffIcon } from '../../../components/icons/index.jsx';

export function LoginForm() {
  const navigate = useNavigate();
  const { login, isLoggingIn } = useLogin();
  const [serverError, setServerError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setServerError(null);
      await login(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleFillDemo = (email, password) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off" noValidate>
      {/* 1-Click Demo Helper Pills */}
      <div className="rounded-xl border border-[#EAE3DB] bg-[#F3EDE6]/40 p-3 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4D6B6D] block mb-2">
          Demo Reviewer Credentials:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleFillDemo('demo@sweety.app', 'Demo@1234')}
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border border-[#195A5F]/30 bg-white text-[#195A5F] hover:bg-[#195A5F]/10 transition-colors"
          >
            <span>Patient Demo</span>
          </button>
          <button
            type="button"
            onClick={() => handleFillDemo('doctor@sweety.app', 'Doctor@1234')}
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border border-[#D0976C]/40 bg-white text-[#8C5832] hover:bg-[#D0976C]/10 transition-colors"
          >
            <span>Doctor Demo</span>
          </button>
        </div>
      </div>

      {serverError && (
        <div
          role="alert"
          className="rounded-xl border border-[#991B1B]/30 bg-[#FEE2E2]/70 p-3 text-xs font-medium text-[#991B1B]"
        >
          {serverError}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold uppercase tracking-wider text-[#4D6B6D] mb-1.5"
        >
          Email address
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="off"
          placeholder="name@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-xs font-medium text-[#991B1B]" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-semibold uppercase tracking-wider text-[#4D6B6D] mb-1.5"
        >
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.password?.message}
            className="pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4D6B6D] hover:text-[#0F3336] transition-colors p-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs font-medium text-[#991B1B]" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          className="w-full text-sm py-2.5"
          isLoading={isLoggingIn}
          disabled={isLoggingIn}
        >
          Sign in
        </Button>
      </div>

      <div className="text-center text-xs text-[#4D6B6D] pt-2">
        Don&apos;t have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-[#195A5F] hover:underline"
        >
          Create patient account
        </Link>
      </div>
    </form>
  );
}
