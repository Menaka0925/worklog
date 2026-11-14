import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Download,
  Check,
  LogOut,
  Trash2,
  Calendar,
  Upload,
  Camera,
  AlertTriangle,
  PauseCircle,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useWorkLog } from '../context/WorkLogContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { formatDateDisplay } from '../utils/dateUtils';

const SUGGESTED_AVATARS = [
  {
    id: 'fox',
    name: 'Clever Fox',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23FF7043"/><polygon points="24,20 38,44 18,40" fill="%23E64A19"/><polygon points="26,24 35,41 21,38" fill="%23FFCCBC"/><polygon points="76,20 82,40 62,44" fill="%23E64A19"/><polygon points="74,24 79,38 65,41" fill="%23FFCCBC"/><ellipse cx="50" cy="56" rx="30" ry="24" fill="%23F4511E"/><path d="M22,54 Q35,68 50,72 Q65,68 78,54 Q82,72 66,78 Q50,84 34,78 Q18,72 22,54 Z" fill="%23FFFFFF"/><polygon points="50,68 44,60 56,60" fill="%23263238"/><circle cx="37" cy="50" r="3.5" fill="%23263238"/><circle cx="63" cy="50" r="3.5" fill="%23263238"/><circle cx="38" cy="49" r="1.2" fill="%23FFFFFF"/><circle cx="64" cy="49" r="1.2" fill="%23FFFFFF"/></svg>',
  },
  {
    id: 'owl',
    name: 'Wise Owl',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%232E7D32"/><polygon points="26,18 42,34 26,38" fill="%231B5E20"/><polygon points="74,18 74,38 58,34" fill="%231B5E20"/><ellipse cx="50" cy="55" rx="30" ry="28" fill="%23388E3C"/><ellipse cx="50" cy="62" rx="20" ry="18" fill="%23C8E6C9"/><circle cx="38" cy="46" r="11" fill="%23FFFFFF"/><circle cx="62" cy="46" r="11" fill="%23FFFFFF"/><circle cx="38" cy="46" r="7" fill="%23FBC02D"/><circle cx="62" cy="46" r="7" fill="%23FBC02D"/><circle cx="38" cy="46" r="4" fill="%23263238"/><circle cx="62" cy="46" r="4" fill="%23263238"/><circle cx="39.5" cy="44.5" r="1.5" fill="%23FFFFFF"/><circle cx="63.5" cy="44.5" r="1.5" fill="%23FFFFFF"/><polygon points="50,56 46,48 54,48" fill="%23FF8F00"/></svg>',
  },
  {
    id: 'panda',
    name: 'Giant Panda',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%2326A69A"/><circle cx="27" cy="28" r="12" fill="%23263238"/><circle cx="73" cy="28" r="12" fill="%23263238"/><ellipse cx="50" cy="54" rx="32" ry="26" fill="%23FFFFFF"/><ellipse cx="37" cy="49" rx="8" ry="10" transform="rotate(-18,37,49)" fill="%23263238"/><ellipse cx="63" cy="49" rx="8" ry="10" transform="rotate(18,63,49)" fill="%23263238"/><circle cx="37" cy="49" r="3" fill="%23FFFFFF"/><circle cx="63" cy="49" r="3" fill="%23FFFFFF"/><circle cx="36.5" cy="49" r="1.5" fill="%23263238"/><circle cx="63.5" cy="49" r="1.5" fill="%23263238"/><ellipse cx="50" cy="61" rx="5" ry="3.5" fill="%23263238"/><path d="M46,65 Q50,68 54,65" stroke="%23263238" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  },
  {
    id: 'songbird',
    name: 'Songbird',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23FFA726"/><ellipse cx="48" cy="54" rx="26" ry="24" fill="%231E88E5"/><ellipse cx="42" cy="58" rx="18" ry="17" fill="%23FFF8E1"/><path d="M52,48 C68,48 72,66 56,72 C50,66 50,56 52,48 Z" fill="%231565C0"/><polygon points="26,48 14,54 26,58" fill="%23FF6F00"/><circle cx="35" cy="45" r="4.5" fill="%23FFFFFF"/><circle cx="34" cy="45" r="2.5" fill="%23263238"/><circle cx="34.8" cy="44.2" r="1" fill="%23FFFFFF"/><path d="M52,30 Q60,32 54,40" stroke="%231565C0" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>',
  },
  {
    id: 'lion',
    name: 'Lion Cub',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%235C6BC0"/><circle cx="50" cy="52" r="32" fill="%23E65100"/><circle cx="30" cy="30" r="8" fill="%23FFA726"/><circle cx="30" cy="30" r="4.5" fill="%23FFE082"/><circle cx="70" cy="30" r="8" fill="%23FFA726"/><circle cx="70" cy="30" r="4.5" fill="%23FFE082"/><ellipse cx="50" cy="54" rx="23" ry="20" fill="%23FFA726"/><ellipse cx="50" cy="61" rx="14" ry="10" fill="%23FFF8E1"/><circle cx="41" cy="49" r="3" fill="%23263238"/><circle cx="59" cy="49" r="3" fill="%23263238"/><circle cx="41.8" cy="48" r="1" fill="%23FFFFFF"/><circle cx="59.8" cy="48" r="1" fill="%23FFFFFF"/><polygon points="50,60 46,56 54,56" fill="%238D6E63"/><path d="M46,63 Q50,65 54,63" stroke="%238D6E63" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
  },
  {
    id: 'bunny',
    name: 'Cute Bunny',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23EC407A"/><ellipse cx="38" cy="25" rx="6" ry="18" fill="%23FFFFFF"/><ellipse cx="38" cy="25" rx="3.5" ry="13" fill="%23F8BBD0"/><ellipse cx="62" cy="25" rx="6" ry="18" fill="%23FFFFFF"/><ellipse cx="62" cy="25" rx="3.5" ry="13" fill="%23F8BBD0"/><circle cx="50" cy="58" r="26" fill="%23FFFFFF"/><circle cx="34" cy="62" r="4.5" fill="%23F8BBD0" opacity="0.7"/><circle cx="66" cy="62" r="4.5" fill="%23F8BBD0" opacity="0.7"/><circle cx="41" cy="54" r="3" fill="%23263238"/><circle cx="59" cy="54" r="3" fill="%23263238"/><circle cx="41.8" cy="53" r="1" fill="%23FFFFFF"/><circle cx="59.8" cy="53" r="1" fill="%23FFFFFF"/><polygon points="50,61 47,58 53,58" fill="%23E91E63"/><path d="M47,64 Q50,66 53,64" stroke="%2378909C" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>',
  },
];

const PAUSE_PRESETS = [3, 7, 14, 30];

export const SettingsPage: React.FC = () => {
  const { user, signOut, updateAvatar, pauseAccount, deleteAccountAndAllData } = useAuth();
  const {
    entries,
    followUps,
    customFields,
    categories,
  } = useWorkLog();

  // Mini Avatar Popup state
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Pause Account Modal State
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [pauseDays, setPauseDays] = useState<number>(7);
  const [customDaysInput, setCustomDaysInput] = useState<string>('');
  const [isPausing, setIsPausing] = useState(false);

  // Delete Account Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Reset Password via Email Verification State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmailError, setResetEmailError] = useState<string | null>(null);
  const [isResetVerified, setIsResetVerified] = useState(false);

  // Set New Password Form State (shown only after email verification)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    // Check if user arrived via password reset email verification link
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    if (params.get('verified_reset') === 'true' || hash.includes('type=recovery') || params.get('code')) {
      setIsResetVerified(true);
      // Clean query parameter from address bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const selectedDays = customDaysInput ? Math.max(1, parseInt(customDaysInput, 10) || 1) : pauseDays;
  const resumeDate = new Date(Date.now() + selectedDays * 24 * 60 * 60 * 1000);

  const handleSelectPresetAvatar = async (dataUrl: string) => {
    await updateAvatar(dataUrl);
    setIsAvatarPickerOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 128, 128);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          updateAvatar(compressedDataUrl);
          setIsAvatarPickerOpen(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = async () => {
    await updateAvatar('');
    setIsAvatarPickerOpen(false);
  };

  const handleConfirmPause = async () => {
    setIsPausing(true);
    await pauseAccount(selectedDays);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') return;
    setIsDeletingAccount(true);
    await deleteAccountAndAllData();
  };

  const handleExportJson = () => {
    const backupData = {
      exported_at: new Date().toISOString(),
      user: user?.email,
      categories,
      entries,
      followUps,
      customFields,
    };

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `worktrace-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSendVerificationEmail = async () => {
    if (!supabase || !user?.email) {
      setResetEmailError('Authentication service unavailable.');
      return;
    }
    setIsSendingResetEmail(true);
    setResetEmailError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/settings?verified_reset=true`,
      });
      if (error) {
        setResetEmailError(error.message || 'Failed to send verification link.');
      } else {
        setResetEmailSent(true);
      }
    } catch {
      setResetEmailError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  const handleUpdateVerifiedPassword = async () => {
    setChangePasswordError(null);
    setChangePasswordSuccess(false);

    if (!newPassword) {
      setChangePasswordError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 8) {
      setChangePasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError('New passwords do not match. Please re-enter.');
      return;
    }
    if (!supabase) {
      setChangePasswordError('Authentication service unavailable.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        setChangePasswordError(updateError.message || 'Failed to update password. Please try again.');
        return;
      }

      setNewPassword('');
      setConfirmPassword('');
      setChangePasswordSuccess(true);
    } catch {
      setChangePasswordError('An unexpected error occurred. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl text-left">
      <div>
        <h1 className="text-xl font-bold text-[#252B27] tracking-tight">Settings & Account</h1>
        <p className="text-xs sm:text-sm text-[#737C74] mt-1">
          Manage your user profile, avatar, activity categories, and workspace data.
        </p>
      </div>

      {/* 1. User Account Overview Card */}
      <div className="bg-white rounded-xl border border-[#E5E9E3] p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#252B27] pb-2 border-b border-[#E5E9E3]">
          <User className="w-4 h-4 text-forest-600" />
          <span>User Account</span>
        </div>

        {/* Profile info row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Interactive Profile Image Circle with Camera badge */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(true)}
                className="relative w-16 h-16 rounded-full bg-forest-100 text-forest-800 font-bold text-2xl flex items-center justify-center shrink-0 border-2 border-forest-200 overflow-hidden shadow-2xs hover:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:ring-offset-2 transition-all cursor-pointer"
                title="Click to choose animal/bird avatar or upload image"
                aria-label="Change profile picture"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.full_name?.charAt(0).toUpperCase() || 'W'
                )}

                {/* Hover Camera Icon Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera className="w-5 h-5" />
                </div>
              </button>

              {/* Little Camera Badge on bottom right */}
              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(true)}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-forest-700 hover:bg-forest-800 text-white flex items-center justify-center border-2 border-white shadow-2xs cursor-pointer transition-colors"
                title="Change profile picture"
                aria-label="Change profile picture"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#252B27]">
                  {user?.full_name || 'Professional User'}
                </h3>
              </div>
              <p className="text-xs text-[#737C74]">{user?.email}</p>

              {/* Read-only Date of Joined */}
              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md bg-[#F7F9F5] border border-[#E5E9E3] text-[11px] text-[#737C74]">
                <Calendar className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                <span>Joined:</span>
                <span className="font-semibold text-[#252B27]">
                  {user?.created_at ? formatDateDisplay(user.created_at.slice(0, 10)) : 'November 2026'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAvatarPickerOpen(true)}
            className="text-xs font-semibold text-forest-700 hover:text-forest-900 self-start sm:self-center cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E9E3] hover:bg-[#F7F9F5] transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Change Photo</span>
          </button>
        </div>
      </div>

      {/* 2. Change Password Card — Shown ONLY when email verification is verified */}
      {isResetVerified && (
        <div className="bg-white rounded-xl border-2 border-emerald-500/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E9E3]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#252B27]">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Set New Password</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Email Verified
            </span>
          </div>

          <p className="text-xs text-[#737C74] leading-relaxed">
            Your identity has been verified via your registered email. Enter your new password and confirm it below.
          </p>

          {changePasswordSuccess && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Password updated successfully! Your new password is now active.</span>
              </div>
              <button
                type="button"
                onClick={() => { setIsResetVerified(false); setChangePasswordSuccess(false); }}
                className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {changePasswordError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <span className="font-semibold">Error: </span>{changePasswordError}
            </div>
          )}

          {!changePasswordSuccess && (
            <div className="grid gap-3 max-w-md">
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#252B27]">New Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737C74]">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setChangePasswordError(null); }}
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-[#D5DDD6] rounded-lg bg-[#F7F9F5] text-[#252B27] placeholder-[#9BA59C] outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737C74] hover:text-[#252B27]"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#252B27]">Confirm New Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737C74]">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setChangePasswordError(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateVerifiedPassword()}
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-[#D5DDD6] rounded-lg bg-[#F7F9F5] text-[#252B27] placeholder-[#9BA59C] outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737C74] hover:text-[#252B27]"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword && confirmPassword === newPassword && (
                  <p className="flex items-center gap-1 text-xs text-emerald-700 mt-1">
                    <Check className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleUpdateVerifiedPassword}
                  disabled={isChangingPassword}
                  isLoading={isChangingPassword}
                  leftIcon={!isChangingPassword ? <KeyRound className="w-3.5 h-3.5" /> : undefined}
                >
                  {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsResetVerified(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Danger Zone Card (Below User Account) */}
      <div className="bg-white rounded-xl border border-rose-200/90 p-5 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-rose-700 pb-2 border-b border-rose-100">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Danger Zone</span>
        </div>

        {/* Action: Reset Password (Above Pause Account) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rose-100/70">
          <div className="max-w-xl">
            <h4 className="text-sm font-bold text-[#252B27] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-700" />
              <span>Reset Password</span>
            </h4>
            <p className="text-xs text-[#737C74] mt-1 leading-relaxed">
              Reset your account password securely via email verification. A secure verification link will be sent to your registered email to verify your identity before setting a new password.
            </p>
          </div>

          <div className="shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setResetEmailSent(false);
                setResetEmailError(null);
                setIsResetModalOpen(true);
              }}
              className="border-amber-300 text-amber-900 hover:bg-amber-50"
              leftIcon={<KeyRound className="w-4 h-4 text-amber-700" />}
            >
              Reset Password
            </Button>
          </div>
        </div>

        {/* Action A: Account Pause */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rose-100/70">
          <div className="max-w-xl">
            <h4 className="text-sm font-bold text-[#252B27] flex items-center gap-2">
              <PauseCircle className="w-4 h-4 text-amber-700" />
              <span>Pause Account</span>
            </h4>
            <p className="text-xs text-[#737C74] mt-1 leading-relaxed">
              Temporarily pause your account for a specific number of days. Your workspace will remain safely locked and you will be signed out until your pause duration ends.
            </p>
          </div>

          <div className="shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPauseModalOpen(true)}
              className="border-amber-300 text-amber-900 hover:bg-amber-50"
              leftIcon={<PauseCircle className="w-4 h-4 text-amber-700" />}
            >
              Pause Account
            </Button>
          </div>
        </div>

        {/* Action B: Permanent Account Deletion */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-xl">
            <h4 className="text-sm font-bold text-rose-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Permanently Delete Account & Data</span>
            </h4>
            <p className="text-xs text-[#737C74] mt-1 leading-relaxed">
              Permanently delete your account along with all stored activity records, follow-up items, and custom category settings. This action cannot be undone.
            </p>
          </div>

          <div className="shrink-0">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                setDeleteConfirmationText('');
                setIsDeleteModalOpen(true);
              }}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Data Backup & Export Card */}
      <div className="bg-white rounded-xl border border-[#E5E9E3] p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#252B27] pb-2 border-b border-[#E5E9E3]">
          <Download className="w-4 h-4 text-forest-600" />
          <span>Offline Data Backup</span>
        </div>

        <p className="text-xs text-[#737C74] leading-relaxed">
          Download a complete JSON export of all your activity records, follow-ups, categories, and custom field configurations.
        </p>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportJson}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export Records to JSON ({entries.length} notes)
        </Button>
      </div>

      {/* Sign Out Button */}
      <div className="pt-2">
        <Button
          variant="danger"
          size="sm"
          onClick={() => signOut()}
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          Sign Out of WorkTrace
        </Button>
      </div>

      {/* Mini Popup for Avatar & Device Upload Selection */}
      <Modal
        isOpen={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
        title="Choose Profile Picture"
        description="Select a suggested animal or bird avatar, or upload a photo from your device."
        maxWidth="md"
      >
        <div className="space-y-5 text-left">
          {/* Suggested Animals & Birds Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#737C74]">
                Suggested Animals & Birds
              </span>
              <span className="text-[11px] text-[#737C74]">6 illustrations</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {SUGGESTED_AVATARS.map((av) => {
                const isSelected = user?.avatar_url === av.dataUrl;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => handleSelectPresetAvatar(av.dataUrl)}
                    className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#E8F0E8] ring-2 ring-forest-700'
                        : 'hover:bg-[#F7F9F5] hover:scale-105'
                    }`}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-2xs">
                      <img
                        src={av.dataUrl}
                        alt={av.name}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-forest-900/35 flex items-center justify-center text-white">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-[#252B27] text-center leading-tight">
                      {av.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload from Device Section */}
          <div className="pt-4 border-t border-[#E5E9E3] space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#737C74] block">
              Device Photo Upload
            </span>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                >
                  Upload from Device
                </Button>
              </div>

              {user?.avatar_url && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                >
                  Remove picture & use initials
                </button>
              )}
            </div>

            {uploadError && (
              <p className="text-xs text-rose-600 font-medium">{uploadError}</p>
            )}
          </div>

          <div className="pt-3 border-t border-[#E5E9E3] flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAvatarPickerOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Pause Account Modal */}
      <Modal
        isOpen={isPauseModalOpen}
        onClose={() => setIsPauseModalOpen(false)}
        title="Pause Your Account"
        description="Select how many days you would like to pause your account."
        maxWidth="md"
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-[#737C74] leading-relaxed">
            During the paused period, your workspace will be locked. You will be signed out from this browser session.
          </p>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#252B27] mb-2">
              Select Pause Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PAUSE_PRESETS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => {
                    setPauseDays(days);
                    setCustomDaysInput('');
                  }}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    pauseDays === days && !customDaysInput
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-[#F7F9F5] border-[#E5E9E3] text-[#252B27] hover:border-amber-400'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#252B27] mb-1">
              Or Custom Days
            </label>
            <Input
              type="number"
              placeholder="e.g. 5, 21, 60"
              value={customDaysInput}
              onChange={(e) => setCustomDaysInput(e.target.value)}
              min="1"
              max="365"
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/80 text-xs text-amber-950 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>Resume Date:</span>
            </div>
            <p className="text-xs">
              Your account will pause for <strong>{selectedDays} day{selectedDays > 1 ? 's' : ''}</strong> and resume on <strong>{formatDateDisplay(resumeDate.toISOString().slice(0, 10))}</strong>.
            </p>
          </div>

          <div className="pt-3 border-t border-[#E5E9E3] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPauseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmPause}
              disabled={isPausing}
              className="bg-amber-700 hover:bg-amber-800 text-white border-amber-800"
            >
              {isPausing ? 'Pausing...' : 'Confirm & Pause Account'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Permanently Delete Account"
        description="This action cannot be undone. All your data will be permanently erased."
        maxWidth="md"
      >
        <div className="space-y-4 text-left">
          <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-950 text-xs space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Permanent Data Destruction Warning</span>
            </div>
            <p className="leading-relaxed">
              Deleting your account will permanently wipe all your records ({entries.length} notes), all follow-up tasks ({followUps.length} items), custom categories, and custom fields from the database.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#252B27] mb-1.5">
              To confirm, type <span className="font-mono text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">DELETE</span> below:
            </label>
            <Input
              type="text"
              placeholder="Type DELETE to confirm"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-[#E5E9E3] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleteConfirmationText.trim().toUpperCase() !== 'DELETE' || isDeletingAccount}
            >
              {isDeletingAccount ? 'Deleting Everything...' : 'Permanently Delete Everything'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Email Verification Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Account Password"
        description="Verify your email address before setting a new password."
        maxWidth="md"
      >
        <div className="space-y-4 text-left">
          {resetEmailSent ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800 text-sm">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Verification Link Sent!</span>
                </div>
                <p className="leading-relaxed text-[#515B53]">
                  We have sent a secure verification link to <strong className="text-[#252B27]">{user?.email}</strong>.
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-[#52675A] pt-1">
                  <li>Check your email inbox (and Spam folder).</li>
                  <li>Click the <strong>Reset Password</strong> link in the email.</li>
                  <li>You will be redirected back here with the Change Password card unlocked.</li>
                </ol>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsResetModalOpen(false)}
                >
                  Got it
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-[#515B53] leading-relaxed">
                For your security, we need to verify your registered email before you can set a new password. Click below to receive a verification link:
              </p>

              <div className="p-3 bg-[#F7F9F5] rounded-lg border border-[#E5E9E3] flex items-center gap-2 text-xs">
                <Mail className="w-4 h-4 text-forest-600 shrink-0" />
                <span className="font-medium text-[#252B27]">{user?.email}</span>
              </div>

              {resetEmailError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  <span className="font-semibold">Error: </span>{resetEmailError}
                </div>
              )}

              <div className="pt-3 border-t border-[#E5E9E3] flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsResetModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSendVerificationEmail}
                  disabled={isSendingResetEmail}
                  isLoading={isSendingResetEmail}
                  leftIcon={<Mail className="w-3.5 h-3.5" />}
                >
                  {isSendingResetEmail ? 'Sending Link...' : 'Send Verification Link'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
