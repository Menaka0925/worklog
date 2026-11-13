import React, { useState, useEffect } from 'react';
import {
  User,
  Briefcase,
  Layers,
  Download,
  Check,
  LogOut,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkLog } from '../context/WorkLogContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const {
    entries,
    followUps,
    customFields,
    categories,
    addCategory,
    deleteCategory,
    workProfile,
    updateWorkProfile,
  } = useWorkLog();

  // Work Profile local state
  const [industry, setIndustry] = useState(workProfile.industry || '');
  const [jobRole, setJobRole] = useState(workProfile.job_role || '');
  const [workType, setWorkType] = useState(workProfile.work_type || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // New category local state
  const [newCatInput, setNewCatInput] = useState('');

  useEffect(() => {
    setIndustry(workProfile.industry || '');
    setJobRole(workProfile.job_role || '');
    setWorkType(workProfile.work_type || '');
  }, [workProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateWorkProfile({
      industry: industry.trim() || undefined,
      job_role: jobRole.trim() || undefined,
      work_type: workType.trim() || undefined,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleAddCategory = async () => {
    const trimmed = newCatInput.trim();
    if (trimmed && !categories.includes(trimmed)) {
      await addCategory(trimmed);
      setNewCatInput('');
    }
  };

  const handleExportJson = () => {
    const backupData = {
      exported_at: new Date().toISOString(),
      user: user?.email,
      workProfile,
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-[#252B27] tracking-tight">Settings & Account</h1>
        <p className="text-xs sm:text-sm text-[#737C74] mt-1">
          Customize your personal work profile, activity categories, and offline data backups.
        </p>
      </div>

      {/* User Identity Overview */}
      <div className="bg-white rounded-xl border border-[#E5E9E3] p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#252B27] pb-2 border-b border-[#E5E9E3]">
          <User className="w-4 h-4 text-forest-600" />
          <span>User Account</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-forest-100 text-forest-800 font-bold text-xl flex items-center justify-center shrink-0 border border-forest-200">
            {user?.full_name?.charAt(0).toUpperCase() || 'W'}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#252B27]">
              {user?.full_name || 'Professional User'}
            </h3>
            <p className="text-xs text-[#737C74]">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Optional Personal Work Profile */}
      <div className="bg-white rounded-xl border border-[#E5E9E3] p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E5E9E3]">
          <div className="flex items-center gap-2 text-sm font-bold text-[#252B27]">
            <Briefcase className="w-4 h-4 text-forest-600" />
            <span>Personal Work Profile</span>
          </div>
          <span className="text-[11px] font-semibold text-[#737C74] uppercase tracking-wider">
            Optional
          </span>
        </div>

        <p className="text-xs text-[#737C74] leading-relaxed">
          Set your industry and role so your records reflect your daily profession. You can change or skip this anytime.
        </p>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Industry"
              placeholder="e.g. Technology, Healthcare, Finance, Education"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />

            <Input
              label="Job Role / Title"
              placeholder="e.g. Software Engineer, Operations Lead, Doctor"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Work Type / Schedule"
              placeholder="e.g. Full-time, Remote, Hybrid, Freelance"
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              size="sm"
              leftIcon={profileSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            >
              {profileSaved ? 'Profile Saved!' : 'Save Work Profile'}
            </Button>
          </div>
        </form>
      </div>

      {/* Activity Categories Configuration */}
      <div className="bg-white rounded-xl border border-[#E5E9E3] p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#252B27] pb-2 border-b border-[#E5E9E3]">
          <Layers className="w-4 h-4 text-forest-600" />
          <span>Activity Categories</span>
        </div>

        <p className="text-xs text-[#737C74] leading-relaxed">
          Configure the activity categories available in your Add Note form. These categories are private to your account.
        </p>

        {/* Add new category */}
        <div className="flex gap-2 max-w-md">
          <Input
            placeholder="Add new category"
            value={newCatInput}
            onChange={(e) => setNewCatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCategory();
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddCategory}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add
          </Button>
        </div>

        {/* Category List */}
        <div className="flex flex-wrap gap-2 pt-1">
          {categories.length === 0 ? (
            <p className="text-xs text-[#737C74] italic">
              No custom categories added yet. Add your own activity categories above.
            </p>
          ) : (
            categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-forest-100/70 border border-forest-200 text-xs font-semibold text-[#252B27]"
              >
                <span>{cat}</span>
                <button
                  type="button"
                  onClick={() => deleteCategory(cat)}
                  className="text-[#737C74] hover:text-rose-700 cursor-pointer"
                  title="Remove category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Data Backup & Export */}
      <div className="bg-white rounded-xl border border-[#E5E9E3] p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#252B27] pb-2 border-b border-[#E5E9E3]">
          <Download className="w-4 h-4 text-forest-600" />
          <span>Offline Data Backup</span>
        </div>

        <p className="text-xs text-[#737C74] leading-relaxed">
          Download a complete JSON export of all your activity records, follow-ups, daily summaries, work profile, and custom field configurations.
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

      {/* Account Actions */}
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
    </div>
  );
};
