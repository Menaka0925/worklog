import React, { useState, useEffect } from 'react';
import { Check, Calendar } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import type { FollowUpItem, FollowUpStatus } from '../../types/followup';
import type { RecordEntry } from '../../types/record';
import { useWorkLog } from '../../context/WorkLogContext';
import { getTodayDateString } from '../../utils/dateUtils';

interface FollowUpFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUpToEdit?: FollowUpItem | null;
  linkedEntry?: RecordEntry | null;
  defaultDate?: string;
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

export const FollowUpFormModal: React.FC<FollowUpFormModalProps> = ({
  isOpen,
  onClose,
  followUpToEdit,
  linkedEntry,
  defaultDate,
}) => {
  const { addFollowUp, updateFollowUp } = useWorkLog();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<FollowUpStatus>('Pending');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [recordId, setRecordId] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (followUpToEdit) {
      setTitle(followUpToEdit.title);
      setDescription(followUpToEdit.description || '');
      setDueDate(followUpToEdit.due_date || '');
      setStatus(followUpToEdit.status);
      setPriority(followUpToEdit.priority || 'medium');
      setRecordId(followUpToEdit.record_id || '');
    } else {
      setTitle('');
      setDescription('');
      setDueDate(defaultDate || linkedEntry?.activity_date || getTodayDateString());
      setStatus('Pending');
      setPriority('medium');
      setRecordId(linkedEntry?.id || '');
    }
    setError(null);
  }, [followUpToEdit, linkedEntry, defaultDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate || undefined,
        status,
        priority,
        record_id: recordId || undefined,
      };

      if (followUpToEdit) {
        await updateFollowUp(followUpToEdit.id, payload);
      } else {
        await addFollowUp(payload);
      }

      onClose();
    } catch (err) {
      console.error('Error saving follow-up:', err);
      setError(err instanceof Error ? err.message : 'Failed to save follow-up to Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={followUpToEdit ? 'Edit Follow-up Item' : 'New Follow-up Item'}
      description="Track discussions, tasks, and deliverables linked to your work activities."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        <Input
          label="Follow-up Title"
          placeholder="e.g. Send revised quotation, Call Karthik for contract discussion"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {linkedEntry && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#E8F0E8] border border-[#C9DBCC] text-xs text-[#244735]">
            <span className="font-semibold">Linked to Activity:</span>
            <span className="truncate">
              {linkedEntry.title || linkedEntry.description.slice(0, 45)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#252B27] mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="block w-full rounded-lg border border-[#E5E9E3] py-2 px-3 text-sm bg-white text-[#252B27] focus:border-forest-600 focus:ring-1 focus:ring-forest-600 cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#252B27] mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as FollowUpStatus)}
              className="block w-full rounded-lg border border-[#E5E9E3] py-2 px-3 text-sm bg-white text-[#252B27] focus:border-forest-600 focus:ring-1 focus:ring-forest-600 cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#252B27] mb-1.5">
            Description / Context (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Add any specific context, action items, or remarks..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full rounded-lg border border-[#E5E9E3] p-2.5 text-sm text-[#252B27] placeholder:text-[#737C74]/60 focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
          />
        </div>

        <div className="pt-4 border-t border-[#E5E9E3] flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            leftIcon={<Check className="w-4 h-4" />}
          >
            {followUpToEdit ? 'Save Changes' : 'Create Follow-up'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
