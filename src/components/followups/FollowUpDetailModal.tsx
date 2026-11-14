import React from 'react';
import { Calendar, Edit2, ArrowRight, Clock } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge, getStatusBadgeVariant } from '../common/Badge';
import type { FollowUpItem } from '../../types/followup';
import { formatDateDisplay, formatTimeDisplay } from '../../utils/dateUtils';
import { useWorkLog } from '../../context/WorkLogContext';

interface FollowUpDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: FollowUpItem | null;
  onEdit: (item: FollowUpItem) => void;
  onOpenSourceEntry?: (entryId: string) => void;
}

export const FollowUpDetailModal: React.FC<FollowUpDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onEdit,
  onOpenSourceEntry,
}) => {
  const { entries } = useWorkLog();

  if (!item) return null;

  const linkedEntry = entries.find((e) => e.id === item.record_id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.title || 'Follow-up Details'}
      description="View full follow-up task details, status, priority, and linked activity."
      maxWidth="lg"
    >
      <div className="space-y-5 text-left">
        {/* Header Badges: Status, Priority & Due Date */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[#E5E9E3]">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getStatusBadgeVariant(item.status)} size="sm">
              {item.status}
            </Badge>

            {item.priority && (
              <Badge
                variant={
                  item.priority === 'high'
                    ? 'danger'
                    : item.priority === 'medium'
                    ? 'warning'
                    : 'default'
                }
                size="sm"
              >
                {item.priority === 'high'
                  ? 'High Priority'
                  : item.priority === 'medium'
                  ? 'Medium Priority'
                  : 'Low Priority'}
              </Badge>
            )}

            {item.due_date && (
              <span className="h-7 inline-flex items-center gap-1.5 px-2.5 rounded-md bg-[#F7F8F5] border border-[#E5E9E3] text-xs font-semibold text-[#252B27]">
                <Calendar className="w-3.5 h-3.5 text-[#315C46] shrink-0" />
                <span>Due: {formatDateDisplay(item.due_date)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737C74] mb-1">
            Task Title
          </label>
          <h3 className="text-base sm:text-lg font-bold text-[#252B27] leading-snug">
            {item.title}
          </h3>
        </div>

        {/* Full Description */}
        {item.description ? (
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737C74] mb-1.5">
              Task Description
            </label>
            <div className="bg-[#F7F8F5] rounded-xl p-4 border border-[#E5E9E3] text-sm text-[#252B27] whitespace-pre-wrap leading-relaxed font-normal max-h-48 sm:max-h-56 overflow-y-auto pr-2.5">
              {item.description}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#737C74] italic">No detailed description provided.</p>
        )}

        {/* Linked Activity Source */}
        {linkedEntry && (
          <div className="pt-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737C74] mb-2">
              Linked Source Activity
            </label>
            <div className="p-3.5 bg-[#F7F8F5] rounded-xl border border-[#E5E9E3] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-6 inline-flex items-center gap-1 px-2 rounded bg-white border border-[#E5E9E3] text-[#252B27] font-medium">
                    <Calendar className="w-3 h-3 text-[#315C46] shrink-0" />
                    <span>{formatDateDisplay(linkedEntry.activity_date)}</span>
                  </span>
                  <span className="h-6 inline-flex items-center gap-1 px-2 rounded bg-white border border-[#E5E9E3] text-[#252B27] font-mono font-medium">
                    <Clock className="w-3 h-3 text-[#315C46] shrink-0" />
                    <span>{formatTimeDisplay(linkedEntry.activity_time)}</span>
                  </span>
                </div>

                {linkedEntry.category && (
                  <span className="h-6 inline-flex items-center px-2 rounded bg-[#E8F0E8] text-[#244735] font-semibold text-[11px] border border-[#C9DBCC]">
                    {linkedEntry.category}
                  </span>
                )}
              </div>

              {linkedEntry.title && (
                <h5 className="text-xs font-bold text-[#252B27]">{linkedEntry.title}</h5>
              )}
              <p className="text-xs text-[#737C74] line-clamp-2 leading-relaxed">
                {linkedEntry.description}
              </p>

              {onOpenSourceEntry && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSourceEntry(linkedEntry.id);
                  }}
                  className="mt-1 text-xs font-semibold text-forest-700 hover:text-forest-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View Source Record Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-4 border-t border-[#E5E9E3] flex items-center justify-between gap-3">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Close
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => {
              onClose();
              onEdit(item);
            }}
            leftIcon={<Edit2 className="w-4 h-4" />}
          >
            Edit Follow-up
          </Button>
        </div>
      </div>
    </Modal>
  );
};
