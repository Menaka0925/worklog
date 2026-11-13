import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Check, MailCheck } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useAuth } from '../../context/AuthContext';

interface RegisterFormProps {
  onToggleToLogin: (email?: string) => void;
  hideHeader?: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleToLogin, hideHeader = false }) => {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isConfirmEntered = confirmPassword.length > 0;
  const isMatched = isConfirmEntered && password.length > 0 && password === confirmPassword;
  const isMismatch = isConfirmEntered && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName || !email || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Both passwords should match.');
      return;
    }

    setIsLoading(true);
    const result = await signUp({
      fullName,
      email,
      password,
      confirmPassword,
    });
    setIsLoading(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full py-4 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center border border-forest-200 shadow-2xs">
          <MailCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-sm">
          <h3 className="text-lg font-bold text-[#252B27]">Your Account Has Been Created!</h3>
          <p className="text-xs text-[#737C74] leading-relaxed">
            We have sent a confirmation link to{' '}
            <span className="font-semibold text-[#252B27]">{email}</span>.
          </p>
          <div className="mt-3 p-3 rounded-lg bg-forest-50/80 border border-forest-200/80 text-xs text-forest-800 text-left space-y-1">
            <p className="font-semibold flex items-center gap-1.5 text-forest-900">
              <Check className="w-3.5 h-3.5 text-forest-600" /> Confirm your email first
            </p>
            <p className="text-[11px] text-forest-700 leading-normal">
              Please check your inbox, click the confirmation link to activate your account, and then proceed to sign in.
            </p>
          </div>
        </div>

        <div className="pt-2 w-full max-w-xs">
          <Button
            type="button"
            className="w-full"
            size="md"
            onClick={() => onToggleToLogin(email)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {!hideHeader && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#252B27] tracking-tight">Create Your Account</h2>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start">
          <span className="font-medium mr-1.5">Error:</span> {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Full Name"
          type="text"
          placeholder="Enter full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
          leftIcon={<User className="w-4 h-4" />}
        />

        <Input
          label="Work Email"
          type="email"
          placeholder="Enter work email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          leftIcon={<Mail className="w-4 h-4" />}
        />

        <Input
          label="Password (min 6 characters)"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          required
          autoComplete="new-password"
          leftIcon={<Lock className="w-4 h-4" />}
          className={
            isMatched
              ? '!text-emerald-600 !border-emerald-500 focus:!border-emerald-600 focus:!ring-emerald-600'
              : ''
          }
          style={isMatched ? { color: '#16a34a' } : undefined}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[#737C74] hover:text-[#252B27] cursor-pointer focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <Input
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          required
          autoComplete="new-password"
          leftIcon={<Lock className="w-4 h-4" />}
          error={isMismatch ? 'Both passwords should match' : undefined}
          className={
            isMatched
              ? '!text-emerald-600 !border-emerald-500 focus:!border-emerald-600 focus:!ring-emerald-600'
              : ''
          }
          style={isMatched ? { color: '#16a34a' } : undefined}
          rightIcon={
            isMatched ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : undefined
          }
        />

        <Button
          type="submit"
          className="w-full mt-3"
          size="md"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Create Account
        </Button>
      </form>

      <div className="mt-5 pt-5 border-t border-[#E5E9E3]">
        <p className="text-center text-xs text-[#737C74]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => onToggleToLogin()}
            className="font-semibold text-forest-700 hover:text-forest-800 hover:underline cursor-pointer"
          >
            Sign in instead
          </button>
        </p>
      </div>
    </div>
  );
};

