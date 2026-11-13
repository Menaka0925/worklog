import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
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
import { getTodayDateString } from '../utils/dateUtils';
import type { RecordEntry } from '../types/record';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { entries, followUps, setSelectedDate } = useWorkLog();

  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<RecordEntry | null>(null);
  const [isAddFollowUpOpen, setIsAddFollowUpOpen] = useState(false);
  const [selectedEntryForFollowUp, setSelectedEntryForFollowUp] = useState<RecordEntry | null>(null);

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

  // Pending & active follow-ups
  const pendingFollowUps = followUps.filter(
    (f) => f.status === 'Pending' || f.status === 'In Progress' || f.status === 'Upcoming'
  );

  // Recent records (sorted by date and time descending)
  const recentEntries = [...entries]
    .sort((a, b) => {
      const dateTimeA = `${a.activity_date} ${a.activity_time}`;
      const dateTimeB = `${b.activity_date} ${b.activity_time}`;
      return dateTimeB.localeCompare(dateTimeA);
    })
    .slice(0, 5);

  const handleEditNote = (entry: RecordEntry) => {
    setEntryToEdit(entry);
    setIsAddNoteOpen(true);
  };

  const handleAddFollowUpForEntry = (entry: RecordEntry) => {
    setSelectedEntryForFollowUp(entry);
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
            <h3 className="text-2xl font-bold text-[#252B27] mt-1">{pendingFollowUps.length}</h3>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Records */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-forest-700" />
              <h2 className="text-base font-bold text-[#252B27]">Recent Records</h2>
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

          <div className="space-y-3.5">
            {recentEntries.map((entry) => (
              <ActivityCard
                key={entry.id}
                entry={entry}
                onEdit={handleEditNote}
                onAddFollowUp={handleAddFollowUpForEntry}
              />
            ))}

            {recentEntries.length === 0 && (
              <div className="bg-white rounded-xl border border-dashed border-[#D5DAD3] p-8 text-center">
                <BookOpen className="w-8 h-8 text-[#737C74] mx-auto mb-2" />
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

        {/* Right Column: Pending Follow-ups & Calendar Shortcut */}
        <div className="lg:col-span-4 space-y-5">
          {/* Pending Follow-ups Card */}
          <div className="bg-white rounded-xl border border-[#E5E9E3] p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9E3]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-warm-700" />
                <h3 className="text-sm font-bold text-[#252B27]">Pending Follow-ups</h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/followups')}
                className="text-xs font-semibold text-forest-700 hover:text-forest-900 cursor-pointer"
              >
                All ({followUps.length})
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {pendingFollowUps.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-[#F7F8F5] border border-[#E5E9E3] hover:border-[#D0D6CE] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={getStatusBadgeVariant(item.status)} size="sm">
                      {item.status}
                    </Badge>
                    {item.due_date && (
                      <span className="text-[10px] text-[#737C74] font-medium">
                        Due {item.due_date}
                      </span>
                    )}
                  </div>
                  <h5 className="text-xs font-semibold text-[#252B27] mt-1.5 leading-snug">
                    {item.title}
                  </h5>
                </div>
              ))}

              {pendingFollowUps.length === 0 && (
                <p className="text-xs text-[#737C74] py-3 text-center italic">
                  No active follow-ups right now.
                </p>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-xs mt-2"
                onClick={() => {
                  setSelectedEntryForFollowUp(null);
                  setIsAddFollowUpOpen(true);
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Follow-up
              </Button>
            </div>
          </div>

          {/* Quick Calendar Jump Widget */}
          <div className="bg-white rounded-xl border border-[#E5E9E3] p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9E3]">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-forest-700" />
                <h3 className="text-sm font-bold text-[#252B27]">Calendar</h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/calendar')}
                className="text-xs font-semibold text-[#737C74] hover:text-[#252B27] cursor-pointer"
              >
                Full View
              </button>
            </div>
            <p className="text-xs text-[#737C74] mt-3 leading-relaxed">
              Explore your past work activity by month or year and review exact chronological timestamps.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="w-full mt-3 justify-center"
              onClick={() => navigate('/calendar')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Open Calendar
            </Button>
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
        }}
        linkedEntry={selectedEntryForFollowUp}
      />
    </div>
  );
};
