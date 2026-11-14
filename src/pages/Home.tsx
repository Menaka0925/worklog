
import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Languages,
  LockKeyhole,
  Plus,
  Search,
  SlidersHorizontal,
  Target,
  UserRound,
} from 'lucide-react';

import logoImg from '../assets/logo.png';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';

export const Home: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'success') {
      setIsRegisterMode(false);
      setAuthSuccessMessage('Password updated successfully! Please sign in with your new password.');
      setAuthModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('login') === 'true') {
      setIsRegisterMode(false);
      setAuthSuccessMessage(null);
      setAuthModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const openLogin = () => {
    setIsRegisterMode(false);
    setAuthSuccessMessage(null);
    setAuthModalOpen(true);
  };

  const openRegister = () => {
    setIsRegisterMode(true);
    setAuthSuccessMessage(null);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#252B27] font-sans selection:bg-[#EAF1EB] selection:text-[#244735]">

      {/* NAVIGATION */}
      <header className="sticky top-0 z-40 border-b border-[#E5E9E3] bg-[#F7F8F5]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-16 px-5 sm:px-8 flex items-center justify-between">

          <a href="#" className="flex items-center" aria-label="WorkTrace home">
            <img
              src={logoImg}
              alt="WorkTrace"
              className="h-10 sm:h-11 w-auto object-contain"
            />
          </a>

          <nav className="flex items-center gap-3">
            <Button
              onClick={openLogin}
              className="text-sm font-medium text-[#515B53] transition-colors px-2 "
            >
              Sign in
            </Button>

            <Button
              onClick={openRegister}
              size="md"
              className="shadow-sm"
            >
              Get started
            </Button>
          </nav>
        </div>
      </header>


      {/* HERO SECTION */}
      <main>

        <section className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#EAF1EB]/60 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28">

            <div className="grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">

              {/* Hero content */}
              <div className="max-w-xl">

                <h1 className="text-[2.6rem] sm:text-5xl lg:text-[3.65rem] font-bold tracking-tight leading-[1.12] text-[#252B27]">
                  Your work happens every day.
                  <span className="block text-[#315C46] mt-2">
                    Don't lose track of it.
                  </span>
                </h1>

                <p className="mt-6 text-base sm:text-lg leading-relaxed text-[#737C74] max-w-lg">
                  Record what you do, remember important conversations,
                  and keep track of what needs attention. One organised
                  place for your everyday work history.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={openRegister}
                    size="lg"
                    className="w-full sm:w-auto shadow-md"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Create your free account
                  </Button>

                  <Button
                    onClick={openLogin}
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Sign in
                  </Button>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-[#737C74]">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#477A61]" />
                    Simple to use
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-[#477A61]" />
                    English, தமிழ் & Tanglish
                  </span>

                  <span className="flex items-center gap-1.5">
                    <LockKeyhole className="w-4 h-4 text-[#477A61]" />
                    Personal workspace
                  </span>
                </div>
              </div>


              {/* Product preview */}
              <div className="relative max-w-xl w-full mx-auto lg:ml-auto">

                <div className="absolute -inset-5 bg-[#E7EEE6]/70 rounded-[2rem] blur-2xl" />

                <div className="relative bg-white rounded-2xl border border-[#E5E9E3] shadow-[0_20px_60px_-25px_rgba(37,43,39,0.2)] overflow-hidden">

                  {/* Preview top bar */}
                  <div className="px-5 sm:px-6 py-4 border-b border-[#EAEDE8] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#EAF1EB] flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-[#315C46]" />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-[#252B27]">
                          My Records
                        </p>
                        <p className="text-[11px] text-[#899189]">
                          Your work, in one place
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#737C74]">
                      <CalendarDays className="w-4 h-4" />
                      Today
                    </div>
                  </div>


                  {/* Preview content */}
                  <div className="p-5 sm:p-6">

                    <div className="flex items-end justify-between mb-5">
                      <div>
                        <p className="text-xs text-[#899189] font-medium">
                          TODAY
                        </p>
                        <h3 className="text-xl font-bold text-[#252B27] mt-1">
                          Daily Activity Log
                        </h3>
                      </div>

                      <span className="text-xs text-[#737C74]">
                        Chronological
                      </span>
                    </div>

                    {/* Clean Interface Preview (Zero dummy data) */}
                    <div className="py-10 px-4 text-center rounded-xl border border-dashed border-[#D5DAD3] bg-[#FBFDFB]">
                      <div className="w-12 h-12 rounded-2xl bg-[#EAF1EB] text-[#315C46] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-[#252B27]">Your Workday Workspace</h4>
                      <p className="text-xs text-[#737C74] max-w-sm mx-auto mt-1 leading-relaxed">
                        Entries, daily activities, and follow-ups are chronologically recorded here as you add them.
                      </p>
                      <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EAF1EB] text-[#315C46] text-xs font-semibold">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ready to record your first entry</span>
                      </div>
                    </div>

                    {/* Preview bottom */}
                    <div className="mt-5 pt-4 border-t border-[#EAEDE8] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-[#737C74]">
                        <LockKeyhole className="w-3.5 h-3.5" />
                        Personal record history
                      </div>

                      <div className="w-8 h-8 rounded-lg bg-[#315C46] flex items-center justify-center">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="relative text-center text-[11px] text-[#899189] mt-4">
                  Personal work activity record workspace.
                </p>
              </div>

            </div>
          </div>
        </section>


        {/* INTRODUCTION / VALUE STRIP */}
        <section className="bg-white border-y border-[#E5E9E3]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
            <div className="grid sm:grid-cols-3 gap-7 sm:gap-4">

              <div className="flex items-center gap-3 sm:justify-center">
                <div className="w-10 h-10 rounded-xl bg-[#EAF1EB] flex items-center justify-center shrink-0">
                  <Clock3 className="w-5 h-5 text-[#315C46]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#252B27]">
                    Record as you go
                  </p>
                  <p className="text-xs text-[#899189] mt-0.5">
                    Separate entries throughout the day
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:justify-center">
                <div className="w-10 h-10 rounded-xl bg-[#F7F0E5] flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5 text-[#A87838]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#252B27]">
                    Find it when needed
                  </p>
                  <p className="text-xs text-[#899189] mt-0.5">
                    Revisit your past work history
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:justify-center">
                <div className="w-10 h-10 rounded-xl bg-[#EAF1EB] flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-[#315C46]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#252B27]">
                    Remember what matters
                  </p>
                  <p className="text-xs text-[#899189] mt-0.5">
                    Keep track of important follow-ups
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* WHAT IS WORKTRACE */}
        <section className="py-20 sm:py-24 px-5 sm:px-8">
          <div className="max-w-7xl mx-auto">

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">

              <div className="max-w-lg">
                <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#477A61] mb-4">
                  A simpler way to keep track
                </p>

                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-[#252B27]">
                  Your work deserves a place you can return to.
                </h2>

                <p className="mt-5 text-sm sm:text-base leading-relaxed text-[#737C74]">
                  A busy day can involve conversations, decisions, small
                  tasks and details that are easy to forget. WorkTrace
                  gives you a dedicated space to record them as they happen.
                </p>

                <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#737C74]">
                  Instead of searching through scattered notes or relying
                  on memory, you can revisit your records whenever you
                  need to remember what happened.
                </p>

                <div className="mt-7 flex items-center gap-2 text-sm font-semibold text-[#315C46]">
                  <Check className="w-4 h-4" />
                  Built around your personal work history
                </div>
              </div>


              {/* Benefits list instead of repeated cards */}
              <div className="border-l border-[#DCE5DC] pl-6 sm:pl-9 space-y-8">

                <div className="relative">
                  <span className="absolute -left-[31px] sm:-left-[40px] top-1 w-3 h-3 rounded-full bg-[#477A61] ring-4 ring-[#F7F8F5]" />

                  <h3 className="text-base font-bold text-[#252B27]">
                    More than a daily note
                  </h3>

                  <p className="text-sm text-[#737C74] leading-relaxed mt-2 max-w-md">
                    Add multiple records on the same day, each with its
                    own time, description, category and relevant details.
                  </p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[31px] sm:-left-[40px] top-1 w-3 h-3 rounded-full bg-[#477A61] ring-4 ring-[#F7F8F5]" />

                  <h3 className="text-base font-bold text-[#252B27]">
                    Your notes, your way
                  </h3>

                  <p className="text-sm text-[#737C74] leading-relaxed mt-2 max-w-md">
                    Write naturally in English, தமிழ் or Tanglish.
                    Keep your notes in the language that feels comfortable.
                  </p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[31px] sm:-left-[40px] top-1 w-3 h-3 rounded-full bg-[#477A61] ring-4 ring-[#F7F8F5]" />

                  <h3 className="text-base font-bold text-[#252B27]">
                    Adapt it to your routine
                  </h3>

                  <p className="text-sm text-[#737C74] leading-relaxed mt-2 max-w-md">
                    Organise records with categories and create custom
                    fields for the additional information you want to remember.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </section>


        {/* HOW IT WORKS */}
        <section className="bg-white border-y border-[#E5E9E3] py-20 sm:py-24 px-5 sm:px-8">
          <div className="max-w-7xl mx-auto">

            <div className="max-w-xl mb-14">
              <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#477A61] mb-4">
                Simple by design
              </p>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#252B27]">
                From everyday work to an organised history.
              </h2>

              <p className="text-sm sm:text-base text-[#737C74] leading-relaxed mt-4">
                No complicated workflow. Just record what happened
                and return to it whenever you need.
              </p>
            </div>


            <div className="grid md:grid-cols-3 gap-10 md:gap-8">

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#EAF1EB] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#315C46]" />
                  </div>
                  <span className="text-4xl font-bold text-[#E3E9E2]">01</span>
                </div>

                <h3 className="text-lg font-bold text-[#252B27]">
                  Record your work
                </h3>

                <p className="text-sm text-[#737C74] leading-relaxed mt-2 max-w-sm">
                  Create separate entries with dates, times, descriptions
                  and any additional details that matter to you.
                </p>
              </div>


              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#F7F0E5] flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-[#A87838]" />
                  </div>
                  <span className="text-4xl font-bold text-[#E3E9E2]">02</span>
                </div>

                <h3 className="text-lg font-bold text-[#252B27]">
                  Keep everything organised
                </h3>

                <p className="text-sm text-[#737C74] leading-relaxed mt-2 max-w-sm">
                  Browse your records by date, use categories and
                  maintain a clear history of your activities.
                </p>
              </div>


              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#EAF1EB] flex items-center justify-center">
                    <Search className="w-5 h-5 text-[#315C46]" />
                  </div>
                  <span className="text-4xl font-bold text-[#E3E9E2]">03</span>
                </div>

                <h3 className="text-lg font-bold text-[#252B27]">
                  Find and follow up
                </h3>

                <p className="text-sm text-[#737C74] leading-relaxed mt-2 max-w-sm">
                  Search your past entries, revisit important details
                  and keep track of pending follow-ups.
                </p>
              </div>

            </div>
          </div>
        </section>


        {/* FEATURES */}
        <section className="py-20 sm:py-24 px-5 sm:px-8">
          <div className="max-w-7xl mx-auto">

            <div className="mb-12 max-w-2xl">

              <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#477A61] mb-4">
                Everything in one place
              </p>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#252B27]">
                The tools to manage your work history.
              </h2>

              <p className="text-sm sm:text-base text-[#737C74] leading-relaxed mt-4 max-w-xl">
                Useful features that help you record, organise and revisit
                your everyday work without unnecessary complexity.
              </p>

            </div>

            <div className="grid md:grid-cols-2 gap-x-16">

              {/* Feature 1 */}
              <div className="flex gap-4 py-7 border-t border-[#E1E7E0]">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-[#EAF1EB] flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[#315C46]" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#252B27]">
                    Personal Records
                  </h3>

                  <p className="text-sm text-[#737C74] leading-relaxed mt-2">
                    Add, edit and revisit multiple work entries throughout
                    the day. Keep each activity as a separate record.
                  </p>
                </div>
              </div>


              {/* Feature 2 */}
              <div className="flex gap-4 py-7 border-t border-[#E1E7E0]">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-[#F7F0E5] flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-[#A87838]" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#252B27]">
                    Calendar History
                  </h3>

                  <p className="text-sm text-[#737C74] leading-relaxed mt-2">
                    View your records by day and move between dates
                    to revisit previous work.
                  </p>
                </div>
              </div>


              {/* Feature 3 */}
              <div className="flex gap-4 py-7 border-t border-[#E1E7E0]">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-[#EAF1EB] flex items-center justify-center">
                  <Search className="w-5 h-5 text-[#315C46]" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#252B27]">
                    Search & Filters
                  </h3>

                  <p className="text-sm text-[#737C74] leading-relaxed mt-2">
                    Find previous entries using keywords, dates,
                    categories, people and other available details.
                  </p>
                </div>
              </div>


              {/* Feature 4 */}
              <div className="flex gap-4 py-7 border-t border-[#E1E7E0]">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-[#F7F0E5] flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-[#A87838]" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#252B27]">
                    Follow-up Tracking
                  </h3>

                  <p className="text-sm text-[#737C74] leading-relaxed mt-2">
                    Keep track of pending work and link follow-ups
                    to the original record for context.
                  </p>
                </div>
              </div>


              {/* Feature 5 */}
              <div className="flex gap-4 py-7 border-t border-[#E1E7E0]">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-[#F7F0E5] flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5 text-[#A87838]" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#252B27]">
                    Custom Fields & Categories
                  </h3>

                  <p className="text-sm text-[#737C74] leading-relaxed mt-2">
                    Personalise your records with your own categories
                    and additional fields to suit your note-taking needs.
                  </p>
                </div>
              </div>


              {/* Feature 6 */}
              <div className="flex gap-4 py-7 border-t border-b border-[#E1E7E0]">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-[#EAF1EB] flex items-center justify-center">
                  <LockKeyhole className="w-5 h-5 text-[#315C46]" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#252B27]">
                    Personal Data & Backup
                  </h3>

                  <p className="text-sm text-[#737C74] leading-relaxed mt-2">
                    Keep your work history associated with your account
                    and export your records for a personal backup.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* PERSONAL WORKSPACE SECTION */}
        <section className="bg-[#EEF2EC] border-y border-[#E0E7DE] py-16 sm:py-20 px-5 sm:px-8">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">

            <div>
              <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#477A61] mb-4">
                Your space, your routine
              </p>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-[#252B27]">
                Keep it simple. Make it yours.
              </h2>

              <p className="mt-4 text-sm sm:text-base text-[#737C74] leading-relaxed max-w-lg">
                Not every workday looks the same. WorkTrace lets you
                organise your records in a way that makes sense to you.
                Start with the essentials and add more details whenever
                you need them.
              </p>
            </div>


            <div className="bg-white rounded-2xl border border-[#DCE5DC] p-6 sm:p-8 shadow-sm">

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#EAF1EB] flex items-center justify-center">
                  <UserRound className="w-5 h-5 text-[#315C46]" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#252B27]">
                    Personalise your records
                  </h3>
                  <p className="text-xs text-[#899189] mt-0.5">
                    Choose what information matters to you
                  </p>
                </div>
              </div>

              <div className="space-y-4">

                <div className="flex items-center justify-between gap-3 border-b border-[#EEF0EC] pb-3">
                  <div>
                    <p className="text-sm font-semibold text-[#252B27]">
                      Categories
                    </p>
                    <p className="text-xs text-[#899189] mt-0.5">
                      Organise different types of records
                    </p>
                  </div>
                  <Check className="w-4 h-4 text-[#477A61] shrink-0" />
                </div>

                <div className="flex items-center justify-between gap-3 border-b border-[#EEF0EC] pb-3">
                  <div>
                    <p className="text-sm font-semibold text-[#252B27]">
                      Custom fields
                    </p>
                    <p className="text-xs text-[#899189] mt-0.5">
                      Add the details you want to capture
                    </p>
                  </div>
                  <Check className="w-4 h-4 text-[#477A61] shrink-0" />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#252B27]">
                      Personal preferences
                    </p>
                    <p className="text-xs text-[#899189] mt-0.5">
                      Keep your workspace comfortable
                    </p>
                  </div>
                  <Check className="w-4 h-4 text-[#477A61] shrink-0" />
                </div>

              </div>
            </div>
          </div>
        </section>


        {/* FINAL CTA */}
        <section className="px-5 sm:px-8 py-20 sm:py-24">
          <div className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl bg-[#244735] px-7 py-14 sm:px-14 sm:py-16 text-center">

            <div className="absolute top-0 left-0 w-72 h-72 rounded-full border border-white/5 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full border border-white/5 translate-x-1/3 translate-y-1/2" />

            <div className="relative">

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-2xl mx-auto leading-tight">
                Make every workday easier to remember.
              </h2>

              <p className="text-sm sm:text-base text-[#D2E0D2]/80 max-w-xl mx-auto mt-5 leading-relaxed">
                Start building your personal work history.
                Record the details today, and find them whenever you need.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">

                <Button
                  onClick={openRegister}
                  variant="white"
                  size="lg"
                  className="w-full sm:w-auto"
                  rightIcon={<ArrowRight className="w-4 h-4 text-[#315C46]" />}
                >
                  Create your free account
                </Button>

                <Button
                  onClick={openLogin}
                  variant="outline-white"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Sign in
                </Button>
              </div>
            </div>
          </div>
        </section>

      </main>


      {/* FOOTER */}
      <footer className="bg-white border-t border-[#E5E9E3]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">

          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <img
                src={logoImg}
                alt="WorkTrace"
                className="h-9 w-auto object-contain"
              />

              <span className="hidden sm:block text-[#D5DBD4]">|</span>

              <p className="text-xs text-[#899189]">
                Your Work. Your Record.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-[#899189]">
              <span>A personal space for your everyday work history.</span>
              <span className="hidden sm:block">·</span>
              <span>© {new Date().getFullYear()} WorkTrace</span>
            </div>

          </div>
        </div>
      </footer>


      {/* LOGIN / REGISTER MODAL */}

      <Modal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        maxWidth="4xl"
        fullScreenOnMobile={true}
      >
        <div className="relative flex flex-col md:flex-row overflow-hidden rounded-2xl md:min-h-[560px]">

          {/* CLOSE BUTTON */}
          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            aria-label="Close modal"
            className="absolute top-3 right-3 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-white text-[#244735] shadow-md hover:bg-[#F5F3E9] transition-colors"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>


          {/* LEFT WELCOME PANEL */}
          <div className="relative md:w-[40%] bg-[#F5F3E9] text-[#244735] p-5 sm:p-7 md:p-9 flex flex-col md:justify-between overflow-hidden">

            {/* Subtle background decoration */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-[#244735]/10" />
            <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full border border-[#244735]/10" />


            {/* Brand and welcome content */}
            <div className="relative z-10">

              {/* Logo */}
              <div className="mb-5 md:mb-14">
                <img
                  src={logoImg}
                  alt="WorkTrace"
                  className="h-12 md:h-16 w-auto object-contain object-left"
                />
              </div>


              {isRegisterMode ? (
                <>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                    A better way to
                    <span className="block text-[#477A61]">
                      remember your work.
                    </span>
                  </h2>

                  <p className="text-sm leading-relaxed text-[#52675A] mt-3 md:mt-5 max-w-sm">
                    Welcome to WorkTrace. Create your personal space
                    to record everyday work, organise important details
                    and revisit your work history whenever you need it.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                    Welcome
                    <span className="block text-[#477A61]">
                      back!
                    </span>
                  </h2>

                  <p className="text-sm leading-relaxed text-[#52675A] mt-3 md:mt-5 max-w-sm">
                    Your work history is right where you left it.
                    Sign in to revisit your records, pick up pending
                    follow-ups and keep everything organised.
                  </p>
                </>
              )}

            </div>


            {/* OPEN BOOK ILLUSTRATION - DESKTOP ONLY */}
            <div className="relative z-10 hidden md:flex justify-center items-center py-8">

              <div className="relative flex justify-center items-center">

                {/* Subtle glow */}
                <div className="absolute w-48 h-32 rounded-full bg-[#8BAF91]/30 blur-2xl" />

                {/* Left page */}
                <div className="relative w-28 h-24 bg-[#F5F3E9] rounded-l-xl border-r border-[#D5D0C1] shadow-[-8px_8px_15px_rgba(0,0,0,0.12)] -rotate-3 flex flex-col justify-center px-4 gap-2">
                  <div className="h-1 w-14 bg-[#B7C7B7] rounded-full" />
                  <div className="h-1 w-16 bg-[#D2D9CE] rounded-full" />
                  <div className="h-1 w-12 bg-[#D2D9CE] rounded-full" />
                  <div className="h-1 w-14 bg-[#D2D9CE] rounded-full" />
                </div>

                {/* Right page */}
                <div className="relative w-28 h-24 bg-[#FFFDF5] rounded-r-xl border-l border-[#D5D0C1] shadow-[8px_8px_15px_rgba(0,0,0,0.12)] rotate-3 flex flex-col justify-center px-4 gap-2">
                  <div className="h-1 w-14 bg-[#477A61] rounded-full" />
                  <div className="h-1 w-16 bg-[#D2D9CE] rounded-full" />
                  <div className="h-1 w-12 bg-[#D2D9CE] rounded-full" />
                  <div className="h-1 w-14 bg-[#D2D9CE] rounded-full" />
                </div>

                {/* Book spine */}
                <div className="absolute w-1.5 h-[90px] rounded-full bg-[#B7C7B7]" />

              </div>
            </div>


            {/* BOTTOM TAGLINE - DESKTOP ONLY */}
            <div className="relative z-10 hidden md:block border-t border-[#244735]/15 pt-5">
              <p className="text-xs text-[#52675A] tracking-wide">
                Your work. Your record. Your story.
              </p>
            </div>

          </div>


          {/* RIGHT FORM PANEL */}
          <div className="flex-1 bg-[#244735] p-4 sm:p-6 md:p-8 flex flex-col justify-center">

            {/* White form card */}
            <div className="w-full bg-white rounded-2xl p-5 sm:p-7 md:p-8 shadow-xl">

              {/* Form tabs */}
              <div className="flex gap-6 border-b border-[#E5E9E3] mb-7">

                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${!isRegisterMode
                    ? 'border-[#315C46] text-[#315C46]'
                    : 'border-transparent text-[#899189] hover:text-[#252B27]'
                    }`}
                >
                  Sign in
                </button>

                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${isRegisterMode
                    ? 'border-[#315C46] text-[#315C46]'
                    : 'border-transparent text-[#899189] hover:text-[#252B27]'
                    }`}
                >
                  Create account
                </button>

              </div>


              {/* Existing authentication forms */}
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
      </Modal>

    </div>
  );
};

export default Home;
