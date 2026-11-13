import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, Filter, X, Calendar, RotateCcw } from 'lucide-react';
import { useWorkLog } from '../context/WorkLogContext';
import { ActivityCard } from '../components/records/ActivityCard';
import { ActivityFormModal } from '../components/records/ActivityFormModal';
import { FollowUpCard } from '../components/followups/FollowUpCard';
import { FollowUpFormModal } from '../components/followups/FollowUpFormModal';
import { RecordDetailModal } from '../components/calendar/RecordDetailModal';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import type { RecordEntry } from '../types/record';
import type { FollowUpItem, FollowUpStatus } from '../types/followup';

const FOLLOWUP_STATUS_OPTIONS: FollowUpStatus[] = [
  'Upcoming',
  'Pending',
  'In Progress',
  'Completed',
  'On Hold',
  'Carried Forward',
  'Cancelled / Rejected',
];

export const SearchPage: React.FC = () => {
  const { entries, categories, followUps } = useWorkLog();

  // Mode: 'records' or 'followups'
  const [activeTab, setActiveTab] = useState<'records' | 'followups'>('records');

  // Common filters
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Records specific filter
  const [category, setCategory] = useState('');

  // Follow-ups specific filters
  const [followUpStatus, setFollowUpStatus] = useState<string>('');
  const [followUpPriority, setFollowUpPriority] = useState<string>('');

  // Modals state
  const [entryToEdit, setEntryToEdit] = useState<RecordEntry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [followUpToEdit, setFollowUpToEdit] = useState<FollowUpItem | null>(null);
  const [linkedEntryForFollowUp, setLinkedEntryForFollowUp] = useState<RecordEntry | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<RecordEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 1. Records filtering logic
  const filteredEntries = useMemo(() => {
    if (activeTab !== 'records') return [];
    const q = keyword.trim().toLowerCase();

    return entries.filter((entry) => {
      // Keyword search across Title, Description, Category, and Custom Field Values
      if (q) {
        const titleMatch = entry.title?.toLowerCase().includes(q);
        const descMatch = entry.description.toLowerCase().includes(q);
        const catMatch = entry.category?.toLowerCase().includes(q);
        const customValuesMatch =
          entry.custom_field_values &&
          Object.values(entry.custom_field_values).some((v) =>
            String(v).toLowerCase().includes(q)
          );

        if (!titleMatch && !descMatch && !catMatch && !customValuesMatch) {
          return false;
        }
      }

      // Date Range
      if (startDate && entry.activity_date < startDate) return false;
      if (endDate && entry.activity_date > endDate) return false;

      // Category
      if (category && entry.category !== category) return false;

      return true;
    });
  }, [entries, activeTab, keyword, startDate, endDate, category]);

  // 2. Follow-ups filtering logic
  const filteredFollowUps = useMemo(() => {
    if (activeTab !== 'followups') return [];
    const q = keyword.trim().toLowerCase();

    return followUps.filter((item) => {
      // Keyword search across Title, Description, Status, Priority, or Linked Record Title
      if (q) {
        const titleMatch = item.title.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        const statusMatch = item.status.toLowerCase().includes(q);
        const priorityMatch = item.priority?.toLowerCase().includes(q);

        const linked = entries.find((e) => e.id === item.record_id);
        const linkedMatch =
          linked &&
          (linked.title?.toLowerCase().includes(q) ||
            linked.description.toLowerCase().includes(q));

        if (!titleMatch && !descMatch && !statusMatch && !priorityMatch && !linkedMatch) {
          return false;
        }
      }

      // Due Date range
      if (startDate && (!item.due_date || item.due_date < startDate)) return false;
      if (endDate && (!item.due_date || item.due_date > endDate)) return false;

      // Status
      if (followUpStatus && item.status !== followUpStatus) return false;

      // Priority
      if (followUpPriority && item.priority !== followUpPriority) return false;

      return true;
    });
  }, [followUps, entries, activeTab, keyword, startDate, endDate, followUpStatus, followUpPriority]);

  const hasActiveFilters = Boolean(
    keyword ||
      startDate ||
      endDate ||
      (activeTab === 'records' && category) ||
      (activeTab === 'followups' && (followUpStatus || followUpPriority))
  );

  const handleResetFilters = () => {
    setKeyword('');
    setStartDate('');
    setEndDate('');
    setCategory('');
    setFollowUpStatus('');
    setFollowUpPriority('');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#252B27] tracking-tight">Search Work History</h1>
        <p className="text-xs sm:text-sm text-[#737C74] mt-1">
          Recall previous activities, meeting decisions, follow-up tasks, or notes recorded in English, தமிழ் or Tanglish.
        </p>
      </div>

      {/* Search Bar & Main Filter Container */}
      <div className="bg-white rounded-xl border border-[#E5E9E3] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Segmented Toggle: Records / Follow-up */}
          <div className="inline-flex p-1 bg-[#F5F3E9] rounded-xl border border-[#E5E9E3] shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('records')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'records'
                  ? 'bg-[#244735] text-white shadow-xs'
                  : 'text-[#737C74] hover:text-[#252B27]'
              }`}
            >
              Records
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('followups')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'followups'
                  ? 'bg-[#244735] text-white shadow-xs'
                  : 'text-[#737C74] hover:text-[#252B27]'
              }`}
            >
              Follow-ups
            </button>
          </div>

          {/* Search Input */}
          <div className="flex-1">
            <Input
              placeholder={
                activeTab === 'records'
                  ? 'Search activities, keywords, categories, or custom fields...'
                  : 'Search follow-up tasks, descriptions, status, or priority...'
              }
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              leftIcon={<SearchIcon className="w-4 h-4 text-[#737C74]" />}
              rightIcon={
                keyword ? (
                  <button
                    type="button"
                    onClick={() => setKeyword('')}
                    className="cursor-pointer text-[#737C74] hover:text-[#252B27]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : undefined
              }
            />
          </div>

          {/* Actions: Filter Toggle & Reset */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant={showAdvancedFilters ? 'primary' : 'outline'}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              leftIcon={<Filter className="w-4 h-4" />}
            >
              Filters
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleResetFilters}
                title="Reset all search filters"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters Expandable Panel */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-[#E5E9E3] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {activeTab === 'records' ? (
              <>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#252B27] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E9E3] py-2 px-2.5 text-xs bg-white text-[#252B27] focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600 cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="From Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  leftIcon={<Calendar className="w-3.5 h-3.5 text-[#737C74]" />}
                />

                <Input
                  label="To Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  leftIcon={<Calendar className="w-3.5 h-3.5 text-[#737C74]" />}
                />
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#252B27] mb-1">
                    Status
                  </label>
                  <select
                    value={followUpStatus}
                    onChange={(e) => setFollowUpStatus(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E9E3] py-2 px-2.5 text-xs bg-white text-[#252B27] focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600 cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    {FOLLOWUP_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#252B27] mb-1">
                    Priority
                  </label>
                  <select
                    value={followUpPriority}
                    onChange={(e) => setFollowUpPriority(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E9E3] py-2 px-2.5 text-xs bg-white text-[#252B27] focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600 cursor-pointer"
                  >
                    <option value="">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Due From"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    leftIcon={<Calendar className="w-3.5 h-3.5 text-[#737C74]" />}
                  />
                  <Input
                    label="Due To"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    leftIcon={<Calendar className="w-3.5 h-3.5 text-[#737C74]" />}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Result Count and Active Filters Bar */}
      <div className="flex items-center justify-between text-xs text-[#737C74] px-1">
        <div>
          {activeTab === 'records' ? (
            <>
              Found <strong className="text-[#252B27]">{filteredEntries.length}</strong> matching{' '}
              {filteredEntries.length === 1 ? 'activity note' : 'activity notes'}
            </>
          ) : (
            <>
              Found <strong className="text-[#252B27]">{filteredFollowUps.length}</strong> matching{' '}
              {filteredFollowUps.length === 1 ? 'follow-up task' : 'follow-up tasks'}
            </>
          )}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-forest-700 hover:text-forest-900 font-semibold cursor-pointer"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-3.5">
        {activeTab === 'records' ? (
          <>
            {filteredEntries.map((entry) => (
              <ActivityCard
                key={entry.id}
                entry={entry}
                onEdit={(e) => {
                  setEntryToEdit(e);
                  setIsEditModalOpen(true);
                }}
                onAddFollowUp={(e) => {
                  setLinkedEntryForFollowUp(e);
                  setFollowUpToEdit(null);
                  setIsFollowUpModalOpen(true);
                }}
              />
            ))}

            {filteredEntries.length === 0 && (
              <div className="bg-white rounded-xl border border-dashed border-[#D5DAD3] p-12 text-center">
                <SearchIcon className="w-8 h-8 text-[#737C74] mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-[#252B27]">No matching activities found</h4>
                <p className="text-xs text-[#737C74] mt-1 max-w-sm mx-auto">
                  Try adjusting your search terms, removing specific filters, or checking date ranges.
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="mt-4"
                  >
                    Reset Search
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {filteredFollowUps.map((item) => (
              <FollowUpCard
                key={item.id}
                item={item}
                onEdit={(fu) => {
                  setFollowUpToEdit(fu);
                  setLinkedEntryForFollowUp(null);
                  setIsFollowUpModalOpen(true);
                }}
                onOpenSourceEntry={(recordId) => {
                  const found = entries.find((e) => e.id === recordId);
                  if (found) {
                    setSelectedRecordForDetail(found);
                    setIsDetailModalOpen(true);
                  }
                }}
              />
            ))}

            {filteredFollowUps.length === 0 && (
              <div className="bg-white rounded-xl border border-dashed border-[#D5DAD3] p-12 text-center">
                <SearchIcon className="w-8 h-8 text-[#737C74] mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-[#252B27]">No matching follow-ups found</h4>
                <p className="text-xs text-[#737C74] mt-1 max-w-sm mx-auto">
                  Try adjusting your search terms, changing the status/priority filter, or checking due date ranges.
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="mt-4"
                  >
                    Reset Search
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <ActivityFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEntryToEdit(null);
        }}
        entryToEdit={entryToEdit}
      />

      <FollowUpFormModal
        isOpen={isFollowUpModalOpen}
        onClose={() => {
          setIsFollowUpModalOpen(false);
          setLinkedEntryForFollowUp(null);
          setFollowUpToEdit(null);
        }}
        followUpToEdit={followUpToEdit}
        linkedEntry={linkedEntryForFollowUp}
      />

      <RecordDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRecordForDetail(null);
        }}
        record={selectedRecordForDetail}
        onEdit={(rec) => {
          setIsDetailModalOpen(false);
          setEntryToEdit(rec);
          setIsEditModalOpen(true);
        }}
        onAddFollowUp={(rec) => {
          setIsDetailModalOpen(false);
          setLinkedEntryForFollowUp(rec);
          setFollowUpToEdit(null);
          setIsFollowUpModalOpen(true);
        }}
      />
    </div>
  );
};
