import React, { useState, useMemo } from 'react';
import { Plus, CheckSquare, Clock, ChevronRight } from 'lucide-react';
import { useWorkLog } from '../context/WorkLogContext';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { RecordDetailModal } from '../components/calendar/RecordDetailModal';
import { ActivityFormModal } from '../components/records/ActivityFormModal';
import { FollowUpFormModal } from '../components/followups/FollowUpFormModal';
import { Button } from '../components/common/Button';
import { formatDateLong, formatTimeDisplay } from '../utils/dateUtils';
import type { RecordEntry } from '../types/record';
import type { FollowUpItem } from '../types/followup';

export const CalendarPage: React.FC = () => {
  const { entries, followUps, selectedDate, setSelectedDate } = useWorkLog();

  // Modals state
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<RecordEntry | null>(null);

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [linkedEntryForFollowUp, setLinkedEntryForFollowUp] = useState<RecordEntry | null>(null);
  const [followUpToEdit, setFollowUpToEdit] = useState<FollowUpItem | null>(null);

  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<RecordEntry | null>(null);

  // Entries for the selected date sorted chronologically (ascending by activity_time)
  const selectedDateEntries = useMemo(() => {
    return entries
      .filter((e) => e.activity_date === selectedDate)
      .sort((a, b) => a.activity_time.localeCompare(b.activity_time));
  }, [entries, selectedDate]);

  // Follow-ups for the selected date
  const selectedDateFollowUps = useMemo(() => {
    return followUps.filter((f) => f.due_date === selectedDate);
  }, [followUps, selectedDate]);

  const hasItems = selectedDateEntries.length > 0 || selectedDateFollowUps.length > 0;

  // Actions
  const handleOpenAddRecord = (defaultDateToUse?: string) => {
    setRecordToEdit(null);
    if (defaultDateToUse) {
      setSelectedDate(defaultDateToUse);
    }
    setIsAddRecordOpen(true);
  };

  const handleOpenAddFollowUpGeneral = () => {
    setLinkedEntryForFollowUp(null);
    setFollowUpToEdit(null);
    setIsFollowUpModalOpen(true);
  };

  const handleEditRecord = (record: RecordEntry) => {
    setRecordToEdit(record);
    setIsAddRecordOpen(true);
  };

  const handleAddFollowUpForRecord = (record: RecordEntry) => {
    setLinkedEntryForFollowUp(record);
    setFollowUpToEdit(null);
    setIsFollowUpModalOpen(true);
  };

  const handleEditFollowUp = (followUp: FollowUpItem) => {
    setFollowUpToEdit(followUp);
    setLinkedEntryForFollowUp(null);
    setIsFollowUpModalOpen(true);
  };

  const selectedDateFormatted = useMemo(() => {
    return formatDateLong(selectedDate);
  }, [selectedDate]);

  // Summary count label
  const countSummary = useMemo(() => {
    const parts: string[] = [];
    if (selectedDateEntries.length > 0) {
      parts.push(
        `${selectedDateEntries.length} ${selectedDateEntries.length === 1 ? 'record' : 'records'
        }`
      );
    }
    if (selectedDateFollowUps.length > 0) {
      parts.push(
        `${selectedDateFollowUps.length} ${selectedDateFollowUps.length === 1 ? 'follow-up' : 'follow-ups'
        }`
      );
    }
    if (parts.length === 0) return '0 records or follow-ups';
    return parts.join(' & ');
  }, [selectedDateEntries.length, selectedDateFollowUps.length]);

  return (
    <div className="space-y-6">
      {/* 1. Calendar Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#252B27] tracking-tight">
            Calendar
          </h1>
          <p className="text-xs sm:text-sm text-[#737C74] mt-0.5">
            Explore your work history by date.
          </p>
        </div>

        {/* Compact Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenAddFollowUpGeneral}
            leftIcon={<CheckSquare className="w-4 h-4 text-[#315C46]" />}
          >
            Add Follow-up
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleOpenAddRecord(selectedDate)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Record
          </Button>
        </div>
      </div>

      {/* 2. Calendar Grid with Month/Year Navigation */}
      <CalendarGrid
        entries={entries}
        followUps={followUps}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* 3. Selected-Date Activity Section (No buttons in header or empty state) */}
      <div className="bg-white rounded-2xl border border-[#E5E9E3] p-5 shadow-2xs space-y-4">
        {/* Section Header: e.g. 02 November 2026 — 3 records & 1 follow-up */}
        <div className="pb-3 border-b border-[#E5E9E3]">
          <h2 className="text-base sm:text-lg font-bold text-[#252B27]">
            {selectedDateFormatted} <span className="text-[#737C74] font-normal">—</span>{' '}
            <span className="text-[#315C46] font-semibold">{countSummary}</span>
          </h2>
        </div>

        {/* Timeline of Records and Follow-ups */}
        {hasItems ? (
          <div className="relative pl-3 sm:pl-4 border-l-2 border-[#E5E9E3] space-y-3 my-2">
            {/* Activity Records */}
            {selectedDateEntries.map((entry) => {
              const displayHeading =
                entry.title?.trim() ||
                (entry.description.length > 50
                  ? `${entry.description.slice(0, 50)}...`
                  : entry.description);

              const entryLinkedFollowUps = followUps.filter((f) => f.record_id === entry.id);

              return (
                <div
                  key={`rec-${entry.id}`}
                  onClick={() => setSelectedRecordForDetail(entry)}
                  className="group relative bg-[#F7F9F5] hover:bg-[#F5F3E9]/50 border border-[#E5E9E3] hover:border-[#477A61] rounded-xl p-3.5 sm:p-4 transition-all cursor-pointer shadow-2xs"
                >
                  {/* Timeline bullet dot for records */}
                  <div className="absolute -left-[19px] sm:-left-[23px] top-5 w-3 h-3 rounded-full bg-[#315C46] border-2 border-white shadow-2xs group-hover:scale-110 transition-transform" />

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {/* Top Line: Time, Category & Linked Follow-up */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#737C74]">
                          <Clock className="w-3 h-3 text-[#315C46]" />
                          <span>{formatTimeDisplay(entry.activity_time)}</span>
                        </span>

                        {entry.category && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E8F0E8] text-[#244735]">
                            <span>{entry.category}</span>
                          </span>
                        )}

                        {entryLinkedFollowUps.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 shadow-2xs">
                            <CheckSquare className="w-2.5 h-2.5 text-amber-700" />
                            <span>
                              Linked Follow-up{entryLinkedFollowUps.length > 1 ? ` (${entryLinkedFollowUps.length})` : ''}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Heading */}
                      <h3 className="text-sm font-bold text-[#252B27] truncate group-hover:text-[#244735] transition-colors">
                        {displayHeading}
                      </h3>

                      {/* One-Line Description Preview */}
                      <p className="text-xs text-[#737C74] truncate mt-0.5 leading-relaxed">
                        {entry.description}
                      </p>
                    </div>

                    <div className="shrink-0 self-center text-[#737C74] group-hover:text-[#244735] group-hover:translate-x-0.5 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Scheduled Follow-ups for this date */}
            {selectedDateFollowUps.map((followUp) => (
              <div
                key={`fu-${followUp.id}`}
                onClick={() => handleEditFollowUp(followUp)}
                className="group relative bg-[#F7F9F5] hover:bg-[#F5F3E9]/50 border border-[#E5E9E3] hover:border-[#477A61] rounded-xl p-3.5 sm:p-4 transition-all cursor-pointer shadow-2xs"
              >
                {/* Timeline bullet dot for follow-ups */}
                <div className="absolute -left-[19px] sm:-left-[23px] top-5 w-3 h-3 rounded-full bg-amber-600 border-2 border-white shadow-2xs group-hover:scale-110 transition-transform" />

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Top Line: Follow-up tag & status */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                        <CheckSquare className="w-3 h-3 text-amber-600" />
                        <span>Follow-up</span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-white text-[#252B27] border border-[#E5E9E3]">
                        {followUp.status}
                      </span>

                      {followUp.priority && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${followUp.priority === 'high'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : followUp.priority === 'medium'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-50 text-slate-600 border border-slate-200'
                            }`}
                        >
                          {followUp.priority}
                        </span>
                      )}
                    </div>

                    {/* Heading */}
                    <h3 className="text-sm font-bold text-[#252B27] truncate group-hover:text-[#244735] transition-colors">
                      {followUp.title}
                    </h3>

                    {/* Description Preview */}
                    {followUp.description && (
                      <p className="text-xs text-[#737C74] truncate mt-0.5 leading-relaxed">
                        {followUp.description}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 self-center text-[#737C74] group-hover:text-[#244735] group-hover:translate-x-0.5 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Clean Empty State (Without bottom action buttons) */
          <div className="rounded-xl border border-dashed border-[#E5E9E3] p-8 text-center bg-[#F7F9F5]/40 space-y-1">
            <h4 className="text-sm font-semibold text-[#252B27]">
              No records or follow-ups for this date
            </h4>
            <p className="text-xs text-[#737C74] max-w-sm mx-auto">
              Your logged activities and scheduled follow-ups for this day will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Record Detail Modal */}
      <RecordDetailModal
        isOpen={Boolean(selectedRecordForDetail)}
        onClose={() => setSelectedRecordForDetail(null)}
        record={selectedRecordForDetail}
        onEdit={handleEditRecord}
        onAddFollowUp={handleAddFollowUpForRecord}
      />

      {/* Add / Edit Record Form Modal */}
      <ActivityFormModal
        isOpen={isAddRecordOpen}
        onClose={() => {
          setIsAddRecordOpen(false);
          setRecordToEdit(null);
        }}
        entryToEdit={recordToEdit}
        defaultDate={selectedDate}
      />

      {/* Add / Edit Follow-Up Form Modal */}
      <FollowUpFormModal
        isOpen={isFollowUpModalOpen}
        onClose={() => {
          setIsFollowUpModalOpen(false);
          setLinkedEntryForFollowUp(null);
          setFollowUpToEdit(null);
        }}
        linkedEntry={linkedEntryForFollowUp}
        followUpToEdit={followUpToEdit}
        defaultDate={selectedDate}
      />
    </div>
  );
};
