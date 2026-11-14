import React, { useState } from 'react';
import { CheckSquare, Plus, Calendar, Edit2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge, getStatusBadgeVariant } from '../common/Badge';
import { FollowUpFormModal } from './FollowUpFormModal';
import type { RecordEntry } from '../../types/record';
import type { FollowUpItem } from '../../types/followup';
import { useWorkLog } from '../../context/WorkLogContext';
import { formatTimeDisplay, formatDateDisplay } from '../../utils/dateUtils';

interface LinkedFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: RecordEntry;
}

export const LinkedFollowUpModal: React.FC<LinkedFollowUpModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const { followUps } = useWorkLog();
  const linkedItems = followUps.filter((f) => f.record_id === record.id);

  const [followUpToEdit, setFollowUpToEdit] = useState<FollowUpItem | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const handleEdit = (item: FollowUpItem) => {
    setFollowUpToEdit(item);
    setIsFormModalOpen(true);
  };

  const handleAddNew = () => {
    setFollowUpToEdit(null);
    setIsFormModalOpen(true);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Linked Follow-up Details"
        description={`Follow-up tasks linked to activity: "${record.title || record.description.slice(0, 45)}"`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Source activity summary card */}
          <div className="p-3.5 bg-[#F7F9F5] rounded-xl border border-[#E5E9E3] space-y-1.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#252B27]">Source Activity:</span>
                <span className="text-[#737C74]">
                  {formatDateDisplay(record.activity_date)} at {formatTimeDisplay(record.activity_time)}
                </span>
              </div>
              {record.category && (
                <span className="px-2 py-0.5 rounded bg-[#E8F0E8] text-[#244735] font-semibold text-[11px] border border-[#C9DBCC]">
                  {record.category}
                </span>
              )}
            </div>
            {record.title && (
              <h5 className="font-bold text-[#252B27]">{record.title}</h5>
            )}
          </div>

          {/* List of linked follow-ups */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1.5">
            {linkedItems.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl border border-[#E5E9E3] space-y-2.5 shadow-2xs text-left"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
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
                        <Calendar className="w-3.5 h-3.5 text-[#315C46]" />
                        <span>Due: {formatDateDisplay(item.due_date)}</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="p-1.5 rounded-md text-[#737C74] hover:text-[#252B27] hover:bg-[#F2F5F0] transition-colors cursor-pointer"
                    title="Edit follow-up"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="text-sm font-bold text-[#252B27] leading-snug">
                  {item.title}
                </h4>

                {/* Description with dedicated scrollbar */}
                {item.description ? (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#737C74] mb-1">
                      Description
                    </label>
                    <div className="bg-[#F7F8F5] rounded-lg p-3 border border-[#E5E9E3] text-xs text-[#252B27] whitespace-pre-wrap leading-relaxed max-h-32 sm:max-h-36 overflow-y-auto pr-2">
                      {item.description}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#737C74] italic">No description provided.</p>
                )}
              </div>
            ))}

            {linkedItems.length === 0 && (
              <div className="p-8 text-center border border-dashed border-[#E5E9E3] rounded-xl text-xs text-[#737C74]">
                <CheckSquare className="w-8 h-8 text-[#737C74] mx-auto mb-2" />
                <p className="font-semibold text-[#252B27]">No follow-ups linked to this record</p>
                <p className="mt-1">You can create one to track tasks or discussions from this activity.</p>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-[#E5E9E3] flex items-center justify-between gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddNew}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Another Follow-up
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit or Add Modal */}
      <FollowUpFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setFollowUpToEdit(null);
        }}
        followUpToEdit={followUpToEdit}
        linkedEntry={record}
      />
    </>
  );
};
