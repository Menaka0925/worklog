import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Edit2, Trash2, ArrowRight } from 'lucide-react';
import type { FollowUpItem, FollowUpStatus } from '../../types/followup';
import { Badge, getStatusBadgeVariant } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatDateDisplay } from '../../utils/dateUtils';
import { useWorkLog } from '../../context/WorkLogContext';
import { FollowUpDetailModal } from './FollowUpDetailModal';

interface FollowUpCardProps {
  item: FollowUpItem;
  onEdit: (item: FollowUpItem) => void;
  onOpenSourceEntry?: (entryId: string) => void;
}

const STATUS_OPTIONS: FollowUpStatus[] = [
  'Upcoming',
  'Pending',
  'In Progress',
  'Completed',
  'On Hold',
  'Carried Forward',
  'Cancelled / Rejected',
];

export const FollowUpCard: React.FC<FollowUpCardProps> = ({
  item,
  onEdit,
  onOpenSourceEntry,
}) => {
  const { deleteFollowUp, updateFollowUp, entries } = useWorkLog();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const descRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const linkedEntry = entries.find((e) => e.id === item.record_id);

  // Detect if description text exceeds 2 lines
  useEffect(() => {
    const checkTruncation = () => {
      if (descRef.current) {
        const el = descRef.current;
        const hasOverflow =
          el.scrollHeight > el.clientHeight + 1 ||
          (item.description && item.description.split('\n').length > 2);
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
  }, [item.description]);

  const handleStatusChange = async (newStatus: FollowUpStatus) => {
    await updateFollowUp(item.id, { status: newStatus });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteFollowUp(item.id);
    setIsDeleting(false);
    setShowConfirm(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-[#E5E9E3] p-4 shadow-2xs hover:border-[#D0D6CE] transition-all flex flex-col justify-between min-h-[145px]">
        <div>
          <div className="flex items-start justify-between gap-3">
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
                <span className="inline-flex items-center gap-1 text-xs text-[#737C74] font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#737C74]" />
                  <span>Due: {formatDateDisplay(item.due_date)}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="p-1.5 rounded-md text-[#737C74] hover:text-[#252B27] hover:bg-[#F2F5F0] transition-colors cursor-pointer"
                title="Edit follow-up"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="p-1.5 rounded-md text-[#737C74] hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Delete follow-up"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-[#252B27] mt-2.5 leading-snug">
            {item.title}
          </h4>

          {item.description && (
            <div
              onClick={() => {
                if (isTruncated) setShowDetailModal(true);
              }}
              className={isTruncated ? 'cursor-pointer group' : ''}
              title={isTruncated ? 'Click to view full description and details' : undefined}
            >
              <p
                ref={descRef}
                className="text-xs text-[#737C74] mt-1 leading-relaxed line-clamp-2 whitespace-pre-line"
              >
                {item.description}
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
          )}
        </div>

        {/* Footer: Quick status switcher & source entry reference */}
        <div className="mt-3.5 pt-3 border-t border-[#E5E9E3] flex flex-wrap items-center justify-between gap-2">
          {linkedEntry ? (
            <button
              type="button"
              onClick={() => onOpenSourceEntry && onOpenSourceEntry(linkedEntry.id)}
              className="text-xs text-forest-600 hover:text-forest-700 font-medium flex items-center gap-1 cursor-pointer truncate max-w-[200px]"
              title={linkedEntry.title || linkedEntry.description}
            >
              <span>From: {linkedEntry.title || linkedEntry.activity_date}</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </button>
          ) : (
            <span className="text-[11px] text-[#737C74]">Standalone item</span>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#737C74]">Status:</span>
            <select
              value={item.status}
              onChange={(e) => handleStatusChange(e.target.value as FollowUpStatus)}
              className="text-xs bg-[#F7F8F5] border border-[#E5E9E3] rounded px-2 py-1 text-[#252B27] focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600 cursor-pointer"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete Follow-up Item?"
        message="Are you sure you want to remove this follow-up item?"
        confirmLabel="Delete Follow-up"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />

      <FollowUpDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        item={item}
        onEdit={(fu) => {
          setShowDetailModal(false);
          onEdit(fu);
        }}
        onOpenSourceEntry={onOpenSourceEntry}
      />
    </>
  );
};
