import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useAuth } from '../../context/AuthContext';

interface LoginFormProps {
  onToggleToRegister: () => void;
  hideHeader?: boolean;
  initialEmail?: string;
  successMessage?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onToggleToRegister,
  hideHeader = false,
  initialEmail = '',
  successMessage,
}) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await signIn({ email, password });
    setIsLoading(false);

    if (result.error) {
      setErrorMessage(result.error);
    }
  };

  return (
    <div className="w-full">
      {!hideHeader && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#252B27] tracking-tight">Sign In to Your Record</h2>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start">
          <span className="font-medium mr-1.5">Error:</span> {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            leftIcon={<Lock className="w-4 h-4" />}
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
          <div className="flex justify-end mt-1.5">
            <a
              href="/forgot-password"
              className="text-xs font-semibold text-[#315C46] hover:text-[#1C3629] hover:underline transition-colors"
            >
              Forgot Password?
            </a>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          size="md"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In to WorkTrace
        </Button>
      </form>

      <div className="mt-5 pt-5 border-t border-[#E5E9E3]">
        <p className="text-center text-xs text-[#737C74]">
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={onToggleToRegister}
            className="font-semibold text-forest-700 hover:text-forest-800 hover:underline cursor-pointer"
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
};

