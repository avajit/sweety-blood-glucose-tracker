import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { registerSchema } from '@sweety/shared/schemas/auth.schema.js';
import { useRegister } from '../hooks/useRegister.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { EyeIcon, EyeOffIcon } from '../../../components/icons/index.jsx';

export function RegisterForm() {
  const navigate = useNavigate();
  const { register: registerUser, isRegistering } = useRegister();
  const [serverError, setServerError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setServerError(null);
      await registerUser(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please check your details.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off" noValidate>
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
          htmlFor="name"
          className="block text-xs font-semibold uppercase tracking-wider text-[#4D6B6D] mb-1.5"
        >
          Full Name
        </label>
        <Input
          id="name"
          type="text"
          autoComplete="off"
          placeholder="Jane Doe"
          error={errors.name?.message}
          {...register('name')}
        />
        {errors.name && (
          <p className="mt-1 text-xs font-medium text-[#991B1B]" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

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
          Password (at least 8 characters)
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
          isLoading={isRegistering}
          disabled={isRegistering}
        >
          Create Account
        </Button>
      </div>

      <div className="text-center text-xs text-[#4D6B6D] pt-2">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-[#195A5F] hover:underline"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}
