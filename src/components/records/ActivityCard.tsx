import React, { useState } from 'react';
import {
  Clock,
  Edit2,
  Trash2,
  ListPlus,
  CheckSquare,
} from 'lucide-react';
import type { RecordEntry } from '../../types/record';
import { formatTimeDisplay } from '../../utils/dateUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { LinkedFollowUpModal } from '../followups/LinkedFollowUpModal';
import { useWorkLog } from '../../context/WorkLogContext';

interface ActivityCardProps {
  entry: RecordEntry;
  onEdit: (entry: RecordEntry) => void;
  onAddFollowUp?: (entry: RecordEntry) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ entry, onEdit, onAddFollowUp }) => {
  const { deleteEntry, customFields, followUps } = useWorkLog();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showLinkedModal, setShowLinkedModal] = useState(false);

  const linkedFollowUps = followUps.filter((f) => f.record_id === entry.id);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteEntry(entry.id);
    setIsDeleting(false);
    setShowConfirmDelete(false);
  };

  return (
    <>
      <article className="bg-white rounded-xl border border-[#E5E9E3] hover:border-[#D0D6CE] transition-all p-5 shadow-2xs">
        {/* Top bar: Time, Category, Linked Follow-up & Actions */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E5E9E3]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-7 inline-flex items-center gap-1.5 px-2.5 rounded-md bg-[#F7F8F5] text-[#252B27] border border-[#E5E9E3] font-mono text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-forest-600 shrink-0" />
              <span>{formatTimeDisplay(entry.activity_time)}</span>
            </span>

            {entry.category && (
              <span className="h-7 inline-flex items-center gap-1.5 px-2.5 rounded-md bg-[#E8F0E8] text-[#244735] border border-[#C9DBCC] text-xs font-semibold">
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
                className="h-7 inline-flex items-center gap-1.5 px-2.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 hover:bg-amber-100 hover:border-amber-300 transition-colors cursor-pointer shadow-2xs"
                title="Click to view linked follow-up details"
              >
                <CheckSquare className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>
                  Linked Follow-up{linkedFollowUps.length > 1 ? ` (${linkedFollowUps.length})` : ''}
                </span>
              </button>
            )}

          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {onAddFollowUp && (
              <button
                type="button"
                onClick={() => onAddFollowUp(entry)}
                className="p-1.5 rounded-md text-[#737C74] hover:text-forest-700 hover:bg-forest-50 transition-colors cursor-pointer text-xs flex items-center gap-1"
                title={
                  linkedFollowUps.length > 0
                    ? 'Add another follow-up for this note'
                    : 'Create follow-up from this note'
                }
              >
                <ListPlus className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">
                  {linkedFollowUps.length > 0 ? 'Follow-up' : 'Follow-up'}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(entry)}
              className="p-1.5 rounded-md text-[#737C74] hover:text-[#252B27] hover:bg-[#F2F5F0] transition-colors cursor-pointer"
              title="Edit note"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="p-1.5 rounded-md text-[#737C74] hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        {entry.title && (
          <h3 className="text-base font-bold text-[#252B27] mt-3 tracking-tight">
            {entry.title}
          </h3>
        )}

        {/* Description - Comfortable Reading */}
        <div className="mt-2 text-sm text-[#252B27] leading-relaxed whitespace-pre-line font-normal">
          {entry.description}
        </div>

        {/* Custom Field Badges */}
        {entry.custom_field_values && Object.keys(entry.custom_field_values).length > 0 && (
          <div className="mt-3 pt-2 border-t border-[#E5E9E3] flex flex-wrap items-center gap-2">
            {Object.entries(entry.custom_field_values).map(([fieldId, val]) => {
              if (val === undefined || val === null || val === '') return null;
              const def = customFields.find((f) => f.id === fieldId);
              const label = def ? def.name : fieldId;
              const displayVal = typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val);

              return (
                <span
                  key={fieldId}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[#F0F3EF] text-[#252B27] border border-[#E5E9E3]"
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
    </>
  );
};
