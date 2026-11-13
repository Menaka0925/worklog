import React, { useState } from 'react';
import { BookOpen, CheckCircle2, ShieldCheck, Languages, Calendar, Search, Sparkles } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';

export const AuthPage: React.FC = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState('');

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E5E9E3] grid grid-cols-1 md:grid-cols-12">
        {/* Left Presentation / Feature Column */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#1C3629] via-[#244735] to-[#15291F] p-8 sm:p-10 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                <BookOpen className="w-5 h-5 text-forest-200" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white leading-none">
                  WorkTrace
                </h1>
                <p className="text-[10px] text-forest-200/80 font-semibold tracking-wider uppercase mt-1">
                  Personal Work Activity Record
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-forest-500/30 text-forest-100 border border-forest-400/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Your Work. Your Record.
              </span>
              <h2 className="text-2xl font-bold tracking-tight leading-snug">
                A personal workspace to record daily activities and remember important details.
              </h2>
              <p className="text-xs sm:text-sm text-forest-100/80 leading-relaxed">
                Log multiple time-stamped entries throughout the day, organize decisions, and keep track of what needs to be done — built for every profession and industry.
              </p>
            </div>

            <div className="mt-8 space-y-3.5 text-xs text-forest-100/90">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-warm-200 shrink-0" />
                <span>Industry-independent: IT, Healthcare, Finance, Manufacturing & more</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Languages className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Write freely in English, தமிழ் or Tanglish</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-forest-200 shrink-0" />
                <span>Chronological daily records & monthly calendar view</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-warm-200 shrink-0" />
                <span>Instant search across notes, people, and custom fields</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Lightweight follow-up and action item tracking</span>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-forest-700/60 text-[11px] text-forest-200/70">
            WorkTrace is a private digital record for individuals. Safe, isolated, and private.
          </div>
        </div>

        {/* Right Form Column */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          {/* Tab Switcher */}
          <div className="flex border-b border-[#E5E9E3] mb-6">
            <button
              type="button"
              onClick={() => setIsRegisterMode(false)}
              className={`pb-3 px-4 text-xs font-semibold tracking-wider transition-colors cursor-pointer border-b-2 -mb-px ${
                !isRegisterMode
                  ? 'border-forest-600 text-forest-700 font-bold'
                  : 'border-transparent text-[#737C74] hover:text-[#252B27]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsRegisterMode(true)}
              className={`pb-3 px-4 text-xs font-semibold tracking-wider transition-colors cursor-pointer border-b-2 -mb-px ${
                isRegisterMode
                  ? 'border-forest-600 text-forest-700 font-bold'
                  : 'border-transparent text-[#737C74] hover:text-[#252B27]'
              }`}
            >
              Create Account
            </button>
          </div>

          {isRegisterMode ? (
            <RegisterForm
              onToggleToLogin={(email) => {
                if (email) setRegisteredEmail(email);
                setAuthSuccessMessage('Account created! Please sign in with your credentials.');
                setIsRegisterMode(false);
              }}
            />
          ) : (
            <LoginForm
              initialEmail={registeredEmail}
              successMessage={authSuccessMessage}
              onToggleToRegister={() => {
                setAuthSuccessMessage(null);
                setIsRegisterMode(true);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
