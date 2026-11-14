import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckSquare,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkLog } from '../context/WorkLogContext';
import { Button } from '../components/common/Button';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { ActivityCard } from '../components/records/ActivityCard';
import { ActivityFormModal } from '../components/records/ActivityFormModal';
import { FollowUpFormModal } from '../components/followups/FollowUpFormModal';
import { getTodayDateString, formatDateDisplay } from '../utils/dateUtils';
import type { RecordEntry } from '../types/record';
import type { FollowUpItem } from '../types/followup';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { entries, followUps, setSelectedDate } = useWorkLog();

  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<RecordEntry | null>(null);
  const [isAddFollowUpOpen, setIsAddFollowUpOpen] = useState(false);
  const [selectedEntryForFollowUp, setSelectedEntryForFollowUp] = useState<RecordEntry | null>(null);
  const [followUpToEdit, setFollowUpToEdit] = useState<FollowUpItem | null>(null);

  const todayStr = getTodayDateString();

  // Metrics
  const todayEntries = entries.filter((e) => e.activity_date === todayStr);
  const todayCount = todayEntries.length;

  // Days with recorded activities this month
  const currentMonthPrefix = todayStr.slice(0, 7); // 'YYYY-MM'
  const activeDaysThisMonth = new Set(
    entries
      .filter((e) => e.activity_date.startsWith(currentMonthPrefix))
      .map((e) => e.activity_date)
  ).size;

  // Helper to calculate difference in calendar days (UTC to avoid TZ / DST discrepancies)
  const getDaysDifference = (dueDateStr: string, todayDateStr: string): number => {
    const [dY, dM, dD] = dueDateStr.split('-').map(Number);
    const [tY, tM, tD] = todayDateStr.split('-').map(Number);
    const dueUtc = Date.UTC(dY, dM - 1, dD);
    const todayUtc = Date.UTC(tY, tM - 1, tD);
    return Math.round((dueUtc - todayUtc) / (1000 * 60 * 60 * 24));
  };

  // Active / pending follow-ups (excluding Completed / Cancelled)
  const activeFollowUps = useMemo(() => {
    return followUps.filter(
      (f) => f.status !== 'Completed' && f.status !== 'Cancelled / Rejected'
    );
  }, [followUps]);

  // Sorted based on due date orders from today's date
  const sortedFollowUps = useMemo(() => {
    return [...activeFollowUps].sort((a, b) => {
      // 1. Items with due dates come before undated items
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;

      // 2. Both have due dates: earliest/overdue/today first
      if (a.due_date && b.due_date) {
        const cmp = a.due_date.localeCompare(b.due_date);
        if (cmp !== 0) return cmp;
      }

      // 3. Priority fallback: high > medium > low
      const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
      const weightA = priorityOrder[a.priority || 'medium'] || 2;
      const weightB = priorityOrder[b.priority || 'medium'] || 2;
      if (weightA !== weightB) return weightB - weightA;

      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  }, [activeFollowUps]);

  // Recent records (sorted by date and time descending)
  const recentEntries = [...entries]
    .sort((a, b) => {
      const dateTimeA = `${a.activity_date} ${a.activity_time}`;
      const dateTimeB = `${b.activity_date} ${b.activity_time}`;
      return dateTimeB.localeCompare(dateTimeA);
    })
    .slice(0, 10);

  const handleEditNote = (entry: RecordEntry) => {
    setEntryToEdit(entry);
    setIsAddNoteOpen(true);
  };

  const handleAddFollowUpForEntry = (entry: RecordEntry) => {
    setSelectedEntryForFollowUp(entry);
    setFollowUpToEdit(null);
    setIsAddFollowUpOpen(true);
  };

  const handleEditFollowUp = (item: FollowUpItem) => {
    setFollowUpToEdit(item);
    setSelectedEntryForFollowUp(null);
    setIsAddFollowUpOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#EFE5D3] via-[#F7EFE1] to-[#EBE0CD] rounded-2xl border border-[#DFCFB3] p-8 sm:p-9 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#252B27] tracking-tight">
            Welcome, {user?.full_name || 'there'}
          </h1>
          <p className="text-sm sm:text-base text-[#5F5647] mt-2 max-w-2xl leading-relaxed">
            Your Work. Your Record. Record daily activities, recall important details, and keep track of what needs to be done.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => {
              setEntryToEdit(null);
              setIsAddNoteOpen(true);
            }}
            size="lg"
            leftIcon={<Plus className="w-5 h-5" />}
          >
            Add Record
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-[#D4C2A2] bg-white/90 hover:bg-white text-[#252B27]"
            onClick={() => {
              setSelectedDate(todayStr);
              navigate('/records');
            }}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Today's Records
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-xl border border-[#E5E9E3] p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#737C74]">Today's Activities</p>
            <h3 className="text-2xl font-bold text-[#252B27] mt-1">{todayCount}</h3>
            <p className="text-[11px] text-[#737C74] mt-0.5">entries recorded today</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center border border-forest-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl border border-[#E5E9E3] p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#737C74]">Active Days This Month</p>
            <h3 className="text-2xl font-bold text-[#252B27] mt-1">{activeDaysThisMonth}</h3>
            <p className="text-[11px] text-forest-700 font-medium mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Consistent work records</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center border border-forest-200">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl border border-[#E5E9E3] p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#737C74]">Pending Follow-ups</p>
            <h3 className="text-2xl font-bold text-[#252B27] mt-1">{activeFollowUps.length}</h3>
            <p className="text-[11px] text-warm-700 font-medium mt-0.5">require your attention</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-warm-50 text-warm-700 flex items-center justify-center border border-warm-200">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl border border-[#E5E9E3] p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#737C74]">Total Activity Records</p>
            <h3 className="text-2xl font-bold text-[#252B27] mt-1">{entries.length}</h3>
            <p className="text-[11px] text-[#737C74] mt-0.5">stored in your private workspace</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center border border-forest-200">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Entries vs Pending Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Records */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-forest-700" />
              <h2 className="text-base font-bold text-[#252B27]">Recent Records</h2>
              {entries.length > 0 && (
                <span className="text-xs text-[#737C74] font-medium">
                  ({recentEntries.length} latest)
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate('/records')}
              className="text-xs font-semibold text-forest-700 hover:text-forest-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 1 Container Card for Recent Records with internal scrolling and fixed height */}
          <div className="bg-white rounded-xl border border-[#E5E9E3] p-4 sm:p-5 shadow-2xs flex flex-col h-[520px]">
            {recentEntries.length > 0 ? (
              <div className="space-y-3 overflow-y-auto pr-1.5 flex-1 min-h-0">
                {recentEntries.map((entry) => (
                  <ActivityCard
                    key={entry.id}
                    entry={entry}
                    onEdit={handleEditNote}
                    onAddFollowUp={handleAddFollowUpForEntry}
                    compact={true}
                    showDate={true}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 my-auto text-center">
                <BookOpen className="w-8 h-8 text-[#737C74] mx-auto mb-2 opacity-60" />
                <h4 className="text-sm font-semibold text-[#252B27]">No activity records yet</h4>
                <p className="text-xs text-[#737C74] mt-1 max-w-sm mx-auto">
                  Start your personal work activity record by creating your first entry.
                </p>
                <Button
                  onClick={() => setIsAddNoteOpen(true)}
                  size="sm"
                  className="mt-4"
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create First Record
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Follow-ups */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-warm-700" />
              <h2 className="text-base font-bold text-[#252B27]">Follow-ups</h2>
              {activeFollowUps.length > 0 && (
                <span className="text-xs text-[#737C74] font-medium">
                  ({activeFollowUps.length} active)
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate('/followups')}
              className="text-xs font-semibold text-forest-700 hover:text-forest-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 1 Container Card for Follow-ups with identical fixed height and inline scrollbar */}
          <div className="bg-white rounded-xl border border-[#E5E9E3] p-4 sm:p-5 shadow-2xs flex flex-col h-[520px]">
            {sortedFollowUps.length > 0 ? (
              <div className="space-y-2.5 overflow-y-auto pr-1.5 flex-1 min-h-0">
                {sortedFollowUps.map((item) => {
                  const diff = item.due_date ? getDaysDifference(item.due_date, todayStr) : null;
                  const isDuedOrToday = diff !== null && diff <= 0;
                  const isTwoDaysWarning = diff !== null && (diff === 2 || diff === 1);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleEditFollowUp(item)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer group ${isDuedOrToday
                        ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300 hover:bg-rose-50/70 shadow-2xs'
                        : isTwoDaysWarning
                          ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300 hover:bg-amber-50/70 shadow-2xs'
                          : 'bg-[#F7F8F5] border-[#E5E9E3] hover:border-[#C9D1C6] hover:bg-[#F2F5F0]'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant={getStatusBadgeVariant(item.status)} size="sm">
                            {item.status}
                          </Badge>
                          {item.priority === 'high' && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              High
                            </span>
                          )}
                        </div>

                        {/* Due Warning or Date Indicator */}
                        {isDuedOrToday && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300 shadow-2xs shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse shrink-0" />
                            <span>attention required*</span>
                          </span>
                        )}

                        {isTwoDaysWarning && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                            <span>{diff === 1 ? '1day for due*' : '2days for due*'}</span>
                          </span>
                        )}

                        {diff !== null && !isDuedOrToday && !isTwoDaysWarning && item.due_date && (
                          <span className="text-[10px] text-[#737C74] font-medium shrink-0">
                            Due {formatDateDisplay(item.due_date)}
                          </span>
                        )}

                        {diff === null && (
                          <span className="text-[10px] text-[#737C74]/70 italic shrink-0">
                            No due date
                          </span>
                        )}
                      </div>

                      <h5 className="text-xs font-semibold text-[#252B27] mt-1.5 leading-snug group-hover:text-forest-800 transition-colors">
                        {item.title}
                      </h5>

                      {item.description && (
                        <p className="text-[11px] text-[#737C74] mt-1 line-clamp-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {item.due_date && (isDuedOrToday || isTwoDaysWarning) && (
                        <div className="mt-1.5 pt-1.5 border-t border-black/5 flex items-center justify-between text-[10px] text-[#737C74]">
                          <span>
                            Due: <span className="font-semibold text-[#252B27]">{formatDateDisplay(item.due_date)}</span>
                          </span>
                          <span className="text-forest-700 font-medium group-hover:underline">
                            Click to edit →
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 my-auto text-center">
                <CheckSquare className="w-8 h-8 text-[#737C74] mx-auto mb-2 opacity-60" />
                <h4 className="text-sm font-semibold text-[#252B27]">No active follow-ups</h4>
                <p className="text-xs text-[#737C74] mt-1 max-w-xs mx-auto">
                  You are all caught up! Add a new follow-up task whenever needed.
                </p>
              </div>
            )}

            {/* Bottom Add Follow-up button */}
            <div className="pt-3 border-t border-[#E5E9E3] mt-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => {
                  setFollowUpToEdit(null);
                  setSelectedEntryForFollowUp(null);
                  setIsAddFollowUpOpen(true);
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Follow-up
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Activity Note Modal */}
      <ActivityFormModal
        isOpen={isAddNoteOpen}
        onClose={() => {
          setIsAddNoteOpen(false);
          setEntryToEdit(null);
        }}
        entryToEdit={entryToEdit}
      />

      {/* Add / Edit Follow-up Modal */}
      <FollowUpFormModal
        isOpen={isAddFollowUpOpen}
        onClose={() => {
          setIsAddFollowUpOpen(false);
          setSelectedEntryForFollowUp(null);
          setFollowUpToEdit(null);
        }}
        followUpToEdit={followUpToEdit}
        linkedEntry={selectedEntryForFollowUp}
      />
    </div>
  );
};
