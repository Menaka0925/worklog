import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import logoImg from '../assets/logo.png';

// ─── Types ───────────────────────────────────────────────────────────────────
type Step = 'email' | 'sent' | 'password' | 'success';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<Step>('email');

  // Step 1 — Email
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Step 2 — Link Sent & Resend State
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 3 — New Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Restriction message
  const [restrictionMsg, setRestrictionMsg] = useState<{ nextDate: string } | null>(null);

  useEffect(() => {
    const sb = supabase;
    if (!sb) return;

    let isMounted = true;

    const checkRecoveryState = async () => {
      // 1. Check if PKCE code is in query parameters (?code=...)
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      if (code) {
        try {
          const { data, error } = await sb.auth.exchangeCodeForSession(code);
          if (!error && data.session && isMounted) {
            if (data.session.user?.email) setEmail(data.session.user.email);
            setStep('password');
            return;
          }
        } catch (e) {
          console.warn('PKCE exchange error:', e);
        }
      }

      // 2. Check if implicit flow tokens are in hash (#access_token=... or type=recovery)
      const hash = window.location.hash;
      if (hash.includes('type=recovery') || (hash.includes('access_token') && !hash.includes('type=signup'))) {
        if (isMounted) setStep('password');
      }

      // 3. Check if user already has an active session from clicking the email link
      try {
        const { data: { session } } = await sb.auth.getSession();
        if (session?.user && isMounted) {
          if (session.user.email) setEmail(session.user.email);
          setStep('password');
        }
      } catch (e) {
        console.warn('Session check error:', e);
      }
    };

    checkRecoveryState();

    // 4. Listen for auth state changes (PASSWORD_RECOVERY or SIGNED_IN from reset link)
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        if (session?.user?.email) setEmail(session.user.email);
        setStep('password');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = (seconds = 60) => {
    setResendCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Step 1: Send Reset Link ───────────────────────────────────────────────
  const handleSendLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setEmailError(null);
    setRestrictionMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setEmailError('Please enter your email address.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setIsSending(true);

    try {
      if (supabase) {
        // Check monthly restriction first (backend enforced)
        const { data: checkData, error: checkError } = await supabase.rpc('check_reset_allowed', {
          p_email: trimmedEmail,
        });

        if (checkError) {
          console.warn('check_reset_allowed note (run migration to enforce):', checkError.message);
        } else if (checkData && !checkData.allowed) {
          setRestrictionMsg({ nextDate: checkData.next_reset_date });
          setIsSending(false);
          return;
        }

        // Send Password Reset Link via Supabase
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: `${window.location.origin}/forgot-password`,
        });

        if (error) {
          if (error.message.includes('rate limit') || error.message.includes('429')) {
            setEmailError('Too many requests. Please wait a minute before trying again.');
          } else {
            setEmailError(error.message || 'Failed to send reset link. Please try again.');
          }
          setIsSending(false);
          return;
        }

        setStep('sent');
        startCooldown(60);
      }
    } catch {
      setEmailError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // ── Step 2: Resend Reset Link ─────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);

    try {
      if (!supabase) return;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/forgot-password`,
      });

      if (error) {
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          alert('Too many requests. Please wait a minute before resending.');
        } else {
          alert(error.message || 'Failed to resend reset link.');
        }
      } else {
        startCooldown(60);
      }
    } finally {
      setIsResending(false);
    }
  };

  // ── Step 3: Update Password ───────────────────────────────────────────────
  const handleUpdatePassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPasswordError(null);

    if (!newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsUpdating(true);

    try {
      if (!supabase) {
        setPasswordError('Authentication service unavailable.');
        return;
      }

      // Update password
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setPasswordError(updateError.message || 'Failed to update password. Please try again.');
        return;
      }

      const userId = updateData?.user?.id;
      if (!userId) {
        setPasswordError('Session error. Please restart the forgot password flow.');
        return;
      }

      // Record successful reset (backend enforced, atomic with unique index)
      const { error: recordError } = await supabase.rpc('record_password_reset', {
        p_user_id: userId,
      });

      if (recordError) {
        console.error('record_password_reset error:', recordError);
      }

      // Also ensure logged into account_activity_history if client session active
      try {
        await supabase.rpc('record_account_activity', {
          p_event_type: 'password_reset',
          p_metadata: { method: 'forgot_password_recovery' },
        });
      } catch {
        // Intentionally ignored: handled server-side by record_password_reset
      }

      // Sign out the temporary recovery session so user logs in fresh
      await supabase.auth.signOut();

      // Redirect directly to Sign In modal on Home page with success message
      window.location.href = '/?reset=success';
    } catch {
      setPasswordError('An unexpected error occurred. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const goToLogin = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#252B27] font-sans selection:bg-[#EAF1EB] selection:text-[#244735] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto shadow-2xl rounded-2xl overflow-hidden border border-[#E5E9E3]">
        <div className="relative flex flex-col md:flex-row overflow-hidden md:min-h-[560px]">

          {/* CLOSE / BACK BUTTON */}
          <button
            type="button"
            onClick={goToLogin}
            aria-label="Back to home"
            className="absolute top-3 right-3 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-white text-[#244735] shadow-md hover:bg-[#F5F3E9] transition-colors cursor-pointer"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>

          {/* LEFT WELCOME PANEL (Ivory Background - matches Login Modal) */}
          <div className="relative md:w-[42%] bg-[#F5F3E9] text-[#244735] p-5 sm:p-7 md:p-9 flex flex-col md:justify-between overflow-hidden">

            {/* Subtle background decoration */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-[#244735]/10 pointer-events-none" />
            <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full border border-[#244735]/10 pointer-events-none" />

            {/* Brand and welcome content */}
            <div className="relative z-10">

              {/* Logo — bigger size matching Login modal */}
              <div className="mb-5 md:mb-12">
                <a href="/" className="inline-block" aria-label="WorkTrace home">
                  <img
                    src={logoImg}
                    alt="WorkTrace"
                    className="h-12 md:h-16 w-auto object-contain object-left cursor-pointer"
                  />
                </a>
              </div>

              {/* Reset Title — without Key Icon */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight text-[#244735]">
                Reset your
                <span className="block text-[#477A61]">
                  password
                </span>
              </h2>

              <p className="text-sm leading-relaxed text-[#52675A] mt-3 md:mt-4 max-w-sm">
                Enter your registered work email to receive a secure link to reset your password.
              </p>

              {/* Step indicator */}
              <div className="mt-8 space-y-2.5">
                {[
                  { label: 'Request reset link', key: 'email' },
                  { label: 'Check your email', key: 'sent' },
                  { label: 'Set new password', key: 'password' },
                ].map((s, i) => {
                  const steps: Step[] = ['email', 'sent', 'password', 'success'];
                  const currentIndex = steps.indexOf(step);
                  const isDone = step === 'success' || currentIndex > i;
                  const isActive = currentIndex === i;

                  return (
                    <div key={s.key} className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-all shrink-0 ${
                          isDone
                            ? 'bg-[#315C46] border-[#315C46] text-white'
                            : isActive
                            ? 'bg-[#315C46]/15 border-[#315C46] text-[#244735] font-extrabold'
                            : 'bg-transparent border-[#244735]/20 text-[#52675A]/60'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : i + 1}
                      </div>
                      <span
                        className={`text-xs transition-all ${
                          isActive
                            ? 'text-[#244735] font-bold'
                            : isDone
                            ? 'text-[#315C46] font-medium'
                            : 'text-[#52675A]/70'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* BOTTOM TAGLINE - DESKTOP ONLY */}
            <div className="relative z-10 hidden md:block border-t border-[#244735]/15 pt-4">
              <p className="text-xs text-[#52675A] tracking-wide">
                Your work. Your record. Your story.
              </p>
            </div>

          </div>

          {/* RIGHT FORM PANEL (Forest Green Panel with White Card - matches Login Modal) */}
          <div className="flex-1 bg-[#244735] p-4 sm:p-6 md:p-8 flex flex-col justify-center">

            {/* White form card */}
            <div className="w-full bg-white rounded-2xl p-5 sm:p-7 md:p-8 shadow-xl">

              {/* ── RESTRICTION MESSAGE ── */}
              {restrictionMsg && step === 'email' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                    <h2 className="text-xl font-bold text-[#252B27] tracking-tight">Reset Limit Reached</h2>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm space-y-2">
                    <p className="font-semibold">You've already reset your password this month.</p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      For security, password resets via Forgot Password are limited to once per calendar month.
                      You can reset your password again from{' '}
                      <strong>{formatDate(restrictionMsg.nextDate)}</strong>.
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      If you're logged in and remember your current password, use{' '}
                      <strong>Settings → Change Password</strong> instead - it has no monthly limit.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2"
                    size="md"
                    onClick={goToLogin}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back to Sign In
                  </Button>
                </div>
              )}

              {/* ── STEP 1: ENTER EMAIL ── */}
              {!restrictionMsg && step === 'email' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-[#252B27] tracking-tight">Forgot Password</h2>
                    <p className="text-xs text-[#737C74] mt-1">
                      Enter your registered email and we'll send you a password reset link.
                    </p>
                  </div>

                  {emailError && (
                    <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start">
                      <span className="font-medium mr-1.5">Error:</span> {emailError}
                    </div>
                  )}

                  <form onSubmit={handleSendLink} className="space-y-4">
                    <Input
                      label="Work Email"
                      type="email"
                      placeholder="Enter work email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                      required
                      autoComplete="email"
                      leftIcon={<Mail className="w-4 h-4" />}
                    />

                    <Button
                      type="submit"
                      className="w-full mt-2"
                      size="md"
                      isLoading={isSending}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      {isSending ? 'Sending Reset Link...' : 'Send Reset Link'}
                    </Button>
                  </form>

                  <div className="mt-5 pt-5 border-t border-[#E5E9E3]">
                    <p className="text-center text-xs text-[#737C74]">
                      Remember your password?{' '}
                      <button
                        type="button"
                        onClick={goToLogin}
                        className="font-semibold text-forest-700 hover:text-forest-800 hover:underline cursor-pointer"
                      >
                        Sign in
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* ── STEP 2: LINK SENT (CHECK EMAIL) ── */}
              {step === 'sent' && (
                <div>
                  <div className="mb-5">
                    <div className="w-12 h-12 rounded-full bg-forest-50 border border-forest-200 flex items-center justify-center mb-4">
                      <Mail className="w-6 h-6 text-forest-700" />
                    </div>
                    <h2 className="text-xl font-bold text-[#252B27] tracking-tight">Check Your Email</h2>
                    <p className="text-xs text-[#737C74] mt-1.5 leading-relaxed">
                      We've sent a password reset link to <strong className="text-[#252B27]">{email.trim()}</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F7F9F5] border border-[#E5E9E3] text-xs text-[#52675A] space-y-2">
                    <p className="font-semibold text-[#252B27] flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-forest-600" />
                      What to do next:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Open your email inbox (check Spam if not found).</li>
                      <li>Click the <strong>Reset Password</strong> link in the email.</li>
                      <li>It will open here to set your new password.</li>
                    </ol>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-4"
                    size="md"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isResending}
                    isLoading={isResending}
                  >
                    {isResending
                      ? 'Resending Link...'
                      : resendCooldown > 0
                      ? `Resend Link in ${resendCooldown}s`
                      : 'Resend Reset Link'}
                  </Button>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E5E9E3] text-xs text-[#737C74]">
                    <button
                      type="button"
                      onClick={() => { setStep('email'); setEmailError(null); }}
                      className="inline-flex items-center gap-1 font-semibold text-forest-700 hover:text-forest-800 hover:underline cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Change email
                    </button>

                    <button
                      type="button"
                      onClick={goToLogin}
                      className="font-semibold text-forest-700 hover:text-forest-800 hover:underline cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: SET NEW PASSWORD ── */}
              {step === 'password' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-[#252B27] tracking-tight">Set New Password</h2>
                    <p className="text-xs text-[#737C74] mt-1">
                      Your reset link is verified. Create a strong new password for your account.
                    </p>
                  </div>

                  {passwordError && (
                    <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start">
                      <span className="font-medium mr-1.5">Error:</span> {passwordError}
                    </div>
                  )}

                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <Input
                      label="New Password"
                      type={showNew ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                      required
                      autoComplete="new-password"
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="text-[#737C74] hover:text-[#252B27] cursor-pointer focus:outline-none"
                          tabIndex={-1}
                        >
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />

                    <div>
                      <Input
                        label="Confirm New Password"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Repeat new password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
                        required
                        autoComplete="new-password"
                        leftIcon={<Lock className="w-4 h-4" />}
                        rightIcon={
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="text-[#737C74] hover:text-[#252B27] cursor-pointer focus:outline-none"
                            tabIndex={-1}
                          >
                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        }
                      />
                      {confirmPassword && newPassword && confirmPassword === newPassword && (
                        <p className="flex items-center gap-1 text-xs text-emerald-700 mt-1.5">
                          <Check className="w-3.5 h-3.5" /> Passwords match
                        </p>
                      )}
                    </div>

                    <div className="p-3 rounded-lg bg-[#F7F9F5] border border-[#E5E9E3] text-xs text-[#737C74] space-y-1">
                      <p className="font-semibold text-[#515B53]">Requirements:</p>
                      <ul className="space-y-0.5 list-disc list-inside">
                        <li className={newPassword.length >= 8 ? 'text-emerald-700 font-medium' : ''}>
                          At least 8 characters
                        </li>
                        <li className={newPassword && newPassword === confirmPassword ? 'text-emerald-700 font-medium' : ''}>
                          Both passwords must match
                        </li>
                      </ul>
                    </div>

                    <Button
                      type="submit"
                      className="w-full mt-2"
                      size="md"
                      isLoading={isUpdating}
                      rightIcon={<ShieldCheck className="w-4 h-4" />}
                    >
                      {isUpdating ? 'Updating Password...' : 'Update Password'}
                    </Button>
                  </form>
                </div>
              )}

              {/* ── STEP 4: SUCCESS ── */}
              {step === 'success' && (
                <div className="space-y-5 text-center py-2">
                  <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center">
                      <Check className="w-7 h-7 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#252B27] tracking-tight">Password Updated!</h2>
                    <p className="text-xs text-[#737C74] mt-2 leading-relaxed">
                      Your password has been successfully updated. You can now sign in with your new credentials.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    For security, your temporary recovery session was closed. Please sign in again.
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full"
                    size="md"
                    onClick={goToLogin}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back to Sign In
                  </Button>
                </div>
              )}

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
