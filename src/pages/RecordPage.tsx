import React, { useState, useMemo, useRef } from 'react';
import { Plus, BookOpen, Calendar as CalendarIcon, ArrowUpDown, X } from 'lucide-react';
import { useWorkLog } from '../context/WorkLogContext';
import { ActivityCard } from '../components/records/ActivityCard';
import { ActivityFormModal } from '../components/records/ActivityFormModal';
import { FollowUpFormModal } from '../components/followups/FollowUpFormModal';
import { Button } from '../components/common/Button';
import { formatDateDisplay, getTodayDateString } from '../utils/dateUtils';
import type { RecordEntry } from '../types/record';

export const RecordPage: React.FC = () => {
  const { entries, categories, selectedDate, setSelectedDate } = useWorkLog();
  const todayStr = getTodayDateString();

  const [filterMode, setFilterMode] = useState<'today' | 'all' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(selectedDate || todayStr);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<RecordEntry | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [linkedEntryForFollowUp, setLinkedEntryForFollowUp] = useState<RecordEntry | null>(null);

  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCalendar = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch {
        dateInputRef.current.focus();
      }
    }
  };

  // Filter entries based on active mode & category
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Date filter
      if (filterMode === 'today' && entry.activity_date !== todayStr) {
        return false;
      }
      if (filterMode === 'custom' && entry.activity_date !== customDate) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && entry.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [entries, filterMode, customDate, todayStr, selectedCategory]);

  // Sort entries (Newest or Oldest first)
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      const dtA = `${a.activity_date} ${a.activity_time}`;
      const dtB = `${b.activity_date} ${b.activity_time}`;
      return sortOrder === 'desc' ? dtB.localeCompare(dtA) : dtA.localeCompare(dtB);
    });
  }, [filteredEntries, sortOrder]);

  // Group entries by date when viewing 'All Records'
  const groupedEntriesByDate = useMemo(() => {
    if (filterMode !== 'all') return [];
    const groups: Record<string, RecordEntry[]> = {};
    for (const entry of sortedEntries) {
      if (!groups[entry.activity_date]) {
        groups[entry.activity_date] = [];
      }
      groups[entry.activity_date].push(entry);
    }
    return Object.entries(groups);
  }, [filterMode, sortedEntries]);

  const handleEditNote = (entry: RecordEntry) => {
    setEntryToEdit(entry);
    setIsAddNoteOpen(true);
  };

  const handleAddFollowUp = (entry: RecordEntry) => {
    setLinkedEntryForFollowUp(entry);
    setIsFollowUpModalOpen(true);
  };

  const handleToggleSort = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const activeDateForModal = filterMode === 'custom' ? customDate : todayStr;

  return (
    <div className="space-y-5">
      {/* Unified Single Header Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E9E3] p-5 shadow-2xs space-y-4">
        {/* Top Row: Page Title, Record Count & Add Record Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-[#252B27] tracking-tight">
                My Records
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-forest-100 text-forest-800 border border-forest-200">
                {sortedEntries.length} {sortedEntries.length === 1 ? 'record' : 'records'}
              </span>
            </div>
            <p className="text-xs text-[#737C74] mt-1">
              {filterMode === 'today' && `Today's activity log • ${formatDateDisplay(todayStr)}`}
              {filterMode === 'custom' && `Records for ${formatDateDisplay(customDate)}`}
              {filterMode === 'all' && 'All recorded activities across all dates'}
            </p>
          </div>

          <Button
            onClick={() => {
              setEntryToEdit(null);
              setIsAddNoteOpen(true);
            }}
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Record
          </Button>
        </div>

        {/* Integrated Filter & Sort Controls Row */}
        <div className="pt-3.5 border-t border-[#E5E9E3] flex flex-wrap items-center justify-between gap-3">
          {/* Quick Date Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Today Filter */}
            <button
              type="button"
              onClick={() => {
                setFilterMode('today');
                setSelectedDate(todayStr);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterMode === 'today'
                  ? 'bg-forest-700 text-white shadow-xs'
                  : 'bg-[#F7F8F5] text-[#252B27] border border-[#E5E9E3] hover:bg-forest-50'
              }`}
            >
              Today
            </button>

            {/* All Records Filter */}
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-forest-700 text-white shadow-xs'
                  : 'bg-[#F7F8F5] text-[#252B27] border border-[#E5E9E3] hover:bg-forest-50'
              }`}
            >
              All Records
            </button>

            {/* Custom Calendar Date Picker Button */}
            <div className="relative inline-flex items-center">
              <button
                type="button"
                onClick={handleOpenCalendar}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  filterMode === 'custom'
                    ? 'bg-forest-700 text-white border-forest-700 shadow-xs'
                    : 'bg-[#F7F8F5] text-[#252B27] border-[#E5E9E3] hover:bg-forest-50'
                }`}
              >
                <CalendarIcon
                  className={`w-3.5 h-3.5 ${
                    filterMode === 'custom' ? 'text-white' : 'text-forest-600'
                  }`}
                />
                <span>
                  {filterMode === 'custom' ? formatDateDisplay(customDate) : 'Filter Date'}
                </span>
              </button>

              {filterMode === 'custom' && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode('today');
                    setSelectedDate(todayStr);
                  }}
                  className="p-1 ml-1 text-[#737C74] hover:text-[#252B27] rounded-md hover:bg-forest-50 cursor-pointer"
                  title="Reset to Today"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <input
                ref={dateInputRef}
                type="date"
                value={customDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setCustomDate(e.target.value);
                    setSelectedDate(e.target.value);
                    setFilterMode('custom');
                  }
                }}
                className="absolute bottom-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Right: Category filter & Sort by Date/Time */}
          <div className="flex items-center gap-2">
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#F7F8F5] border border-[#E5E9E3] text-[#252B27] focus:border-forest-600 focus:ring-1 focus:ring-forest-600 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleToggleSort}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F7F8F5] border border-[#E5E9E3] text-[#252B27] hover:bg-forest-50 transition-colors cursor-pointer"
              title={`Sort order: ${sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-forest-600" />
              <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* List of Activities */}
      <div className="space-y-4">
        {filterMode === 'all' && groupedEntriesByDate.length > 0 ? (
          // Grouped by date in 'All Records' mode
          groupedEntriesByDate.map(([dateKey, groupEntries]) => (
            <div key={dateKey} className="space-y-3">
              <div className="flex items-center gap-2 pt-2">
                <CalendarIcon className="w-4 h-4 text-forest-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#252B27]">
                  {formatDateDisplay(dateKey)}
                </h3>
                <span className="text-[11px] font-medium text-[#737C74]">
                  ({groupEntries.length})
                </span>
              </div>
              <div className="space-y-3">
                {groupEntries.map((entry) => (
                  <ActivityCard
                    key={entry.id}
                    entry={entry}
                    onEdit={handleEditNote}
                    onAddFollowUp={handleAddFollowUp}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Single day list
          sortedEntries.map((entry) => (
            <ActivityCard
              key={entry.id}
              entry={entry}
              onEdit={handleEditNote}
              onAddFollowUp={handleAddFollowUp}
            />
          ))
        )}

        {/* Empty State */}
        {sortedEntries.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-[#D5DAD3] p-10 text-center">
            <BookOpen className="w-10 h-10 text-[#737C74] mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-[#252B27]">
              {filterMode === 'today'
                ? 'No records logged for today yet'
                : filterMode === 'custom'
                ? `No records found for ${formatDateDisplay(customDate)}`
                : 'No records found'}
            </h4>
            <p className="text-xs text-[#737C74] mt-1 max-w-sm mx-auto">
              {filterMode === 'today'
                ? 'Start recording tasks, calls, meetings, or notes for today.'
                : 'Log an activity for this date to keep your work records up to date.'}
            </p>
            <Button
              onClick={() => {
                setEntryToEdit(null);
                setIsAddNoteOpen(true);
              }}
              size="sm"
              className="mt-4"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Record
            </Button>
          </div>
        )}
      </div>

      {/* Add / Edit Activity Note Modal */}
      <ActivityFormModal
        isOpen={isAddNoteOpen}
        onClose={() => {
          setIsAddNoteOpen(false);
          setEntryToEdit(null);
        }}
        entryToEdit={entryToEdit}
        defaultDate={activeDateForModal}
      />

      {/* Follow-up creation modal */}
      <FollowUpFormModal
        isOpen={isFollowUpModalOpen}
        onClose={() => {
          setIsFollowUpModalOpen(false);
          setLinkedEntryForFollowUp(null);
        }}
        linkedEntry={linkedEntryForFollowUp}
      />
    </div>
  );
};
