import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Edit2,
  Trash2,
  ListPlus,
  CheckSquare,
  Calendar as CalendarIcon,
} from 'lucide-react';
import type { RecordEntry } from '../../types/record';
import { formatTimeDisplay } from '../../utils/dateUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { LinkedFollowUpModal } from '../followups/LinkedFollowUpModal';
import { RecordDetailModal } from '../calendar/RecordDetailModal';
import { useWorkLog } from '../../context/WorkLogContext';

interface ActivityCardProps {
  entry: RecordEntry;
  onEdit: (entry: RecordEntry) => void;
  onAddFollowUp?: (entry: RecordEntry) => void;
  compact?: boolean;
  showDate?: boolean;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  entry,
  onEdit,
  onAddFollowUp,
  compact = false,
  showDate = false,
}) => {
  const { deleteEntry, customFields, followUps } = useWorkLog();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showLinkedModal, setShowLinkedModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const descRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const linkedFollowUps = followUps.filter((f) => f.record_id === entry.id);

  // Detect if description text exceeds 2 lines
  useEffect(() => {
    const checkTruncation = () => {
      if (descRef.current) {
        const el = descRef.current;
        const hasOverflow =
          el.scrollHeight > el.clientHeight + 1 ||
          !!(entry.description && entry.description.split('\n').length > 2);
        setIsTruncated(hasOverflow);
      }
    };

    checkTruncation();
    const rafId = requestAnimationFrame(checkTruncation);
    window.addEventListener('resize', checkTruncation);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', checkTruncation);
    };
  }, [entry.description]);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteEntry(entry.id);
    setIsDeleting(false);
    setShowConfirmDelete(false);
  };

  return (
    <>
      <article
        className={`rounded-xl border transition-all flex flex-col justify-between ${
          compact
            ? 'p-3 sm:p-3.5 bg-[#F7F8F5]/85 hover:bg-[#F2F5F0] border-[#E5E9E3] hover:border-[#D0D6CE]'
            : 'p-4 sm:p-5 bg-white border-[#E5E9E3] hover:border-[#D0D6CE] shadow-2xs min-h-[145px]'
        }`}
      >
        <div>
          {/* Top bar: Time, Category, Linked Follow-up & Actions */}
          <div
            className={`flex items-start justify-between gap-2.5 ${
              compact ? 'pb-2.5 border-b border-[#C5CEBF]' : 'pb-3 border-b border-[#C5CEBF]'
            }`}
          >
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Optional Date pill */}
              {showDate && (
                <span
                  className={`${
                    compact ? 'h-6 px-2 text-[11px]' : 'h-7 px-2.5 text-xs'
                  } inline-flex items-center gap-1.5 rounded-md bg-white text-[#252B27] border border-[#E5E9E3] font-medium`}
                >
                  <CalendarIcon
                    className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-forest-600 shrink-0`}
                  />
                  <span>{entry.activity_date}</span>
                </span>
              )}

              {/* Time pill */}
              <span
                className={`${
                  compact ? 'h-6 px-2 text-[11px]' : 'h-7 px-2.5 text-xs'
                } inline-flex items-center gap-1.5 rounded-md bg-white text-[#252B27] border border-[#E5E9E3] font-mono font-semibold`}
              >
                <Clock
                  className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-forest-600 shrink-0`}
                />
                <span>{formatTimeDisplay(entry.activity_time)}</span>
              </span>

              {/* Category pill */}
              {entry.category && (
                <span
                  className={`${
                    compact ? 'h-6 px-2 text-[11px]' : 'h-7 px-2.5 text-xs'
                  } inline-flex items-center gap-1.5 rounded-md bg-[#E8F0E8] text-[#244735] border border-[#C9DBCC] font-semibold`}
                >
                  <span>{entry.category}</span>
                </span>
              )}

              {/* Linked Follow-up Button */}
              {linkedFollowUps.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLinkedModal(true);
                  }}
                  className={`${
                    compact ? 'h-6 px-2 text-[11px]' : 'h-7 px-2.5 text-xs'
                  } inline-flex items-center gap-1.5 rounded-md font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 hover:bg-amber-100 hover:border-amber-300 transition-colors cursor-pointer shadow-2xs`}
                  title="Click to view linked follow-up details"
                >
                  <CheckSquare
                    className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-700 shrink-0`}
                  />
                  <span>
                    Linked Follow-up{linkedFollowUps.length > 1 ? ` (${linkedFollowUps.length})` : ''}
                  </span>
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-0.5 shrink-0">
              {onAddFollowUp && (
                <button
                  type="button"
                  onClick={() => onAddFollowUp(entry)}
                  className={`${
                    compact ? 'p-1 text-[11px]' : 'p-1.5 text-xs'
                  } rounded-md text-[#737C74] hover:text-forest-700 hover:bg-forest-50 transition-colors cursor-pointer flex items-center gap-1`}
                  title={
                    linkedFollowUps.length > 0
                      ? 'Add another follow-up for this note'
                      : 'Create follow-up from this note'
                  }
                >
                  <ListPlus className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                  <span className="hidden sm:inline font-medium">Follow-up</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onEdit(entry)}
                className={`${
                  compact ? 'p-1' : 'p-1.5'
                } rounded-md text-[#737C74] hover:text-[#252B27] hover:bg-white transition-colors cursor-pointer`}
                title="Edit note"
              >
                <Edit2 className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className={`${
                  compact ? 'p-1' : 'p-1.5'
                } rounded-md text-[#737C74] hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer`}
                title="Delete note"
              >
                <Trash2 className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              </button>
            </div>
          </div>

          {/* Title */}
          {entry.title && (
            <h3
              className={`${
                compact ? 'text-sm mt-2' : 'text-base mt-3'
              } font-bold text-[#252B27] tracking-tight`}
            >
              {entry.title}
            </h3>
          )}

          {/* Description clamped to 2 lines with ... (more) */}
          <div
            onClick={() => {
              if (isTruncated) setShowDetailModal(true);
            }}
            className={isTruncated ? 'cursor-pointer group' : ''}
            title={isTruncated ? 'Click to view full record details' : undefined}
          >
            <p
              ref={descRef}
              className={`${
                compact ? 'mt-1.5 text-xs' : 'mt-2 text-sm'
              } text-[#252B27] leading-relaxed line-clamp-2 whitespace-pre-line font-normal`}
            >
              {entry.description}
            </p>
            {isTruncated && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetailModal(true);
                }}
                className="mt-0.5 text-xs font-semibold text-forest-700 hover:text-forest-900 inline-flex items-center gap-0.5 cursor-pointer transition-colors"
              >
                <span>... (more)</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Field Badges */}
        {entry.custom_field_values && Object.keys(entry.custom_field_values).length > 0 && (
          <div
            className={`flex flex-wrap items-center ${
              compact ? 'mt-2 pt-1.5 gap-1.5 border-t border-[#E5E9E3]/70' : 'mt-3 pt-2 gap-2 border-t border-[#E5E9E3]'
            }`}
          >
            {Object.entries(entry.custom_field_values).map(([fieldId, val]) => {
              if (val === undefined || val === null || val === '') return null;
              const def = customFields.find((f) => f.id === fieldId);
              const label = def ? def.name : fieldId;
              const displayVal = typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val);

              return (
                <span
                  key={fieldId}
                  className={`inline-flex items-center gap-1 rounded bg-white text-[#252B27] border border-[#E5E9E3] ${
                    compact ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'
                  }`}
                >
                  <span className="text-[#737C74]">{label}:</span>
                  <span className="font-semibold text-[#252B27]">{displayVal}</span>
                </span>
              );
            })}
          </div>
        )}
      </article>

      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Delete Activity Note?"
        message="Are you sure you want to delete this activity note? Any follow-up linked specifically to this note will also be unlinked."
        confirmLabel="Delete Note"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />

      <LinkedFollowUpModal
        isOpen={showLinkedModal}
        onClose={() => setShowLinkedModal(false)}
        record={entry}
      />

      <RecordDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        record={entry}
        onEdit={(rec) => {
          setShowDetailModal(false);
          onEdit(rec);
        }}
        onAddFollowUp={(rec) => {
          setShowDetailModal(false);
          if (onAddFollowUp) onAddFollowUp(rec);
        }}
      />
    </>
  );
};
