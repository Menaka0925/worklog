import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  CheckSquare,
  ChevronDown,
  Filter,
  Calendar,
  X,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useWorkLog } from '../context/WorkLogContext';
import { FollowUpCard } from '../components/followups/FollowUpCard';
import { FollowUpFormModal } from '../components/followups/FollowUpFormModal';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { formatDateDisplay } from '../utils/dateUtils';
import type { FollowUpItem, FollowUpStatus } from '../types/followup';
import type { RecordEntry } from '../types/record';
import { RecordDetailModal } from '../components/calendar/RecordDetailModal';
import { ActivityFormModal } from '../components/records/ActivityFormModal';

const ALL_STATUS_TABS: (FollowUpStatus | 'All')[] = [
  'All',
  'Pending',
  'In Progress',
  'Upcoming',
  'On Hold',
  'Carried Forward',
  'Completed',
  'Cancelled / Rejected',
];

export const FollowUpsPage: React.FC = () => {
  const { followUps, entries } = useWorkLog();

  // Status Filter State
  const [activeTab, setActiveTab] = useState<FollowUpStatus | 'All'>('All');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Date Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<FollowUpItem | null>(null);

  // Source Record Detail State
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<RecordEntry | null>(null);
  const [isRecordDetailOpen, setIsRecordDetailOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<RecordEntry | null>(null);
  const [isRecordEditOpen, setIsRecordEditOpen] = useState(false);

  // Refs for outside click detection
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const isDateFilterApplied = Boolean(appliedStartDate || appliedEndDate);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(e.target as Node)
      ) {
        setIsStatusDropdownOpen(false);
      }
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter and sort follow-ups by Status and Due Date Range, ordered from today's date
  const filteredFollowUps = useMemo(() => {
    const list = followUps.filter((item) => {
      // 1. Status Filter
      if (activeTab !== 'All' && item.status !== activeTab) {
        return false;
      }

      // 2. Due Date Range Filter
      if (appliedStartDate) {
        if (!item.due_date || item.due_date < appliedStartDate) {
          return false;
        }
      }
      if (appliedEndDate) {
        if (!item.due_date || item.due_date > appliedEndDate) {
          return false;
        }
      }

      return true;
    });

    return list.sort((a, b) => {
      // Prioritize active (uncompleted) items before completed/cancelled when viewing 'All'
      const isACompleted = a.status === 'Completed' || a.status === 'Cancelled / Rejected';
      const isBCompleted = b.status === 'Completed' || b.status === 'Cancelled / Rejected';
      if (!isACompleted && isBCompleted) return -1;
      if (isACompleted && !isBCompleted) return 1;

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
  }, [followUps, activeTab, appliedStartDate, appliedEndDate]);

  const handleApplyDateFilter = () => {
    setAppliedStartDate(tempStartDate);
    setAppliedEndDate(tempEndDate);
    setIsFilterOpen(false);
  };

  const handleResetDateFilter = () => {
    setTempStartDate('');
    setTempEndDate('');
    setAppliedStartDate('');
    setAppliedEndDate('');
  };

  const handleClearAllFilters = () => {
    setActiveTab('All');
    handleResetDateFilter();
  };

  const handleEdit = (item: FollowUpItem) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#252B27] tracking-tight">
            Follow-ups
          </h1>
          <p className="text-xs sm:text-sm text-[#737C74] mt-1">
            Keep track of open actions, deliverables, and commitments linked to your activity records.
          </p>
        </div>

        <Button
          onClick={() => {
            setItemToEdit(null);
            setIsModalOpen(true);
          }}
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Follow-up
        </Button>
      </div>

      {/* Controls Bar: Status Dropdown & Date Range Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E9E3]">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1. Status Filter Dropdown */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsStatusDropdownOpen(!isStatusDropdownOpen);
                setIsFilterOpen(false);
              }}
              className={`h-9 px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab !== 'All'
                  ? 'bg-[#E8F0E8] text-[#244735] border-[#C9DBCC] shadow-2xs'
                  : 'bg-white text-[#252B27] border-[#E5E9E3] hover:border-[#D0D6CE] hover:bg-[#F7F9F5]'
              }`}
            >
              <span>{activeTab === 'All' ? 'All' : activeTab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab !== 'All'
                    ? 'bg-[#315C46] text-white'
                    : 'bg-[#F0F3EF] text-[#737C74]'
                }`}
              >
                {activeTab === 'All'
                  ? followUps.length
                  : followUps.filter((f) => f.status === activeTab).length}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#737C74] transition-transform ${
                  isStatusDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Status Dropdown Menu */}
            {isStatusDropdownOpen && (
              <div className="absolute left-0 mt-2 w-60 bg-white rounded-xl border border-[#E5E9E3] shadow-lg p-1.5 z-30 space-y-0.5 animate-in fade-in-50 duration-150">
                {ALL_STATUS_TABS.map((tab) => {
                  const isSelected = activeTab === tab;
                  const count =
                    tab === 'All'
                      ? followUps.length
                      : followUps.filter((f) => f.status === tab).length;

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#E8F0E8] text-[#244735] font-semibold'
                          : 'text-[#252B27] hover:bg-[#F7F9F5]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#315C46]" />}
                        <span>{tab}</span>
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-[#315C46] text-white font-bold'
                            : 'bg-[#F0F3EF] text-[#737C74]'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Date Range Filter Popover */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsFilterOpen(!isFilterOpen);
                setIsStatusDropdownOpen(false);
              }}
              className={`h-9 px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isDateFilterApplied
                  ? 'bg-[#E8F0E8] text-[#244735] border-[#C9DBCC] shadow-2xs'
                  : 'bg-white text-[#252B27] border-[#E5E9E3] hover:border-[#D0D6CE] hover:bg-[#F7F9F5]'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-[#315C46]" />
              <span>
                {isDateFilterApplied
                  ? `Due: ${appliedStartDate ? formatDateDisplay(appliedStartDate) : '...'} - ${appliedEndDate ? formatDateDisplay(appliedEndDate) : '...'}`
                  : 'Filter'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#737C74] transition-transform ${
                  isFilterOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Date Range Popover Panel */}
            {isFilterOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl border border-[#E5E9E3] shadow-lg p-4 z-30 space-y-3.5 animate-in fade-in-50 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E9E3]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#252B27]">
                    <Calendar className="w-4 h-4 text-[#315C46]" />
                    <span>Filter by Due Date</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="text-[#737C74] hover:text-[#252B27] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  <Input
                    label="From Date"
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                  />
                  <Input
                    label="To Date"
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                  />
                </div>

                {/* Apply / Reset Action Button */}
                <div className="pt-2 border-t border-[#E5E9E3]">
                  {isDateFilterApplied ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetDateFilter}
                      className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Reset
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleApplyDateFilter}
                      className="w-full"
                      disabled={!tempStartDate && !tempEndDate}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Apply
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Count & Clear All */}
        <div className="flex items-center gap-2 text-xs text-[#737C74]">
          <span>
            Showing <strong className="text-[#252B27]">{filteredFollowUps.length}</strong> of{' '}
            {followUps.length} follow-ups
          </span>
          {(activeTab !== 'All' || isDateFilterApplied) && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-xs text-forest-700 hover:text-forest-900 font-semibold cursor-pointer underline ml-1"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFollowUps.map((item) => (
          <FollowUpCard
            key={item.id}
            item={item}
            onEdit={handleEdit}
            onOpenSourceEntry={(recordId) => {
              const found = entries.find((e) => e.id === recordId);
              if (found) {
                setSelectedRecordForDetail(found);
                setIsRecordDetailOpen(true);
              }
            }}
          />
        ))}

        {filteredFollowUps.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-dashed border-[#D5DAD3] p-10 text-center">
            <CheckSquare className="w-8 h-8 text-[#737C74] mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-[#252B27]">
              No follow-ups found
            </h4>
            <p className="text-xs text-[#737C74] mt-1 max-w-sm mx-auto">
              {activeTab !== 'All' || isDateFilterApplied
                ? 'Try adjusting or clearing your status and date filters.'
                : 'Create a follow-up item to keep your office commitments organized.'}
            </p>
            {activeTab !== 'All' || isDateFilterApplied ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllFilters}
                className="mt-4"
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setItemToEdit(null);
                  setIsModalOpen(true);
                }}
                size="sm"
                className="mt-4"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                New Follow-up Item
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Follow-up Modal */}
      <FollowUpFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setItemToEdit(null);
        }}
        followUpToEdit={itemToEdit}
      />

      {/* Source Record Detail Modal */}
      <RecordDetailModal
        isOpen={isRecordDetailOpen}
        onClose={() => setIsRecordDetailOpen(false)}
        record={selectedRecordForDetail}
        onEdit={(rec) => {
          setIsRecordDetailOpen(false);
          setRecordToEdit(rec);
          setIsRecordEditOpen(true);
        }}
        onAddFollowUp={() => {
          setIsRecordDetailOpen(false);
          setItemToEdit(null);
          setIsModalOpen(true);
        }}
      />

      {/* Activity Edit Modal */}
      <ActivityFormModal
        isOpen={isRecordEditOpen}
        onClose={() => {
          setIsRecordEditOpen(false);
          setRecordToEdit(null);
        }}
        entryToEdit={recordToEdit}
      />
    </div>
  );
};
