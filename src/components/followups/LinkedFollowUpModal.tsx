import React, { useState } from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { FollowUpCard } from './FollowUpCard';
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
        description={`Follow-up task linked to activity: "${record.title || record.description.slice(0, 45)}"`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Source activity summary card */}
          <div className="p-3 bg-[#F7F9F5] rounded-xl border border-[#E5E9E3] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#252B27]">Activity:</span>
              <span className="text-[#737C74]">
                {formatDateDisplay(record.activity_date)} at {formatTimeDisplay(record.activity_time)}
              </span>
            </div>
            {record.category && (
              <span className="px-2 py-0.5 rounded bg-[#E8F0E8] text-[#244735] font-semibold text-[11px]">
                {record.category}
              </span>
            )}
          </div>

          {/* List of linked follow-ups */}
          <div className="space-y-3">
            {linkedItems.map((item) => (
              <FollowUpCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
              />
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

