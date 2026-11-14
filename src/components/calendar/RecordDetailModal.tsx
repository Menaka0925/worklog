import React from 'react';
import {
  Clock,
  Calendar,
  Edit2,
  CheckSquare,
  FileText,
  Plus
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { RecordEntry } from '../../types/record';
import { useWorkLog } from '../../context/WorkLogContext';
import { formatDateDisplay, formatTimeDisplay } from '../../utils/dateUtils';

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: RecordEntry | null;
  onEdit: (record: RecordEntry) => void;
  onAddFollowUp: (record: RecordEntry) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  onEdit,
  onAddFollowUp,
}) => {
  const { customFields, followUps } = useWorkLog();

  if (!record) return null;

  const linkedFollowUps = followUps.filter((f) => f.record_id === record.id);

  // Filter custom fields that have a non-empty value for this entry
  const customFieldEntries = customFields
    .map((cf) => {
      const val = record.custom_field_values?.[cf.id];
      const hasValue =
        val !== undefined &&
        val !== null &&
        val !== '' &&
        (Array.isArray(val) ? val.length > 0 : true);
      return {
        field: cf,
        value: val,
        hasValue,
      };
    })
    .filter((item) => item.hasValue);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={record.title || 'Record Details'}
      description="View full activity details, notes, and metadata."
      maxWidth="2xl"
    >
      <div className="space-y-5 text-left">
        {/* Timestamp & Category Header Badge Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[#E5E9E3]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-7 inline-flex items-center gap-1.5 px-2.5 rounded-md bg-[#F7F9F5] border border-[#E5E9E3] text-xs font-semibold text-[#252B27]">
              <Calendar className="w-3.5 h-3.5 text-[#315C46] shrink-0" />
              <span>{formatDateDisplay(record.activity_date)}</span>
            </span>

            <span className="h-7 inline-flex items-center gap-1.5 px-2.5 rounded-md bg-[#F7F9F5] border border-[#E5E9E3] text-xs font-semibold text-[#252B27]">
              <Clock className="w-3.5 h-3.5 text-[#315C46] shrink-0" />
              <span>{formatTimeDisplay(record.activity_time)}</span>
            </span>

            {record.category && (
              <span className="h-7 inline-flex items-center gap-1.5 px-2.5 rounded-md bg-[#E8F0E8] text-[#244735] font-semibold text-xs border border-[#C9DBCC]">
                <span>{record.category}</span>
              </span>
            )}

            {/* Linked Follow-up Badge in Header */}
            {linkedFollowUps.length > 0 && (
              <span className="h-7 inline-flex items-center gap-1.5 px-2.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/90 font-semibold text-xs shadow-2xs">
                <CheckSquare className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>
                  Linked Follow-up{linkedFollowUps.length > 1 ? ` (${linkedFollowUps.length})` : ''}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Full Title (if provided) */}
        {record.title && (
          <div>
            <h3 className="text-lg font-bold text-[#252B27] leading-snug">
              {record.title}
            </h3>
          </div>
        )}

        {/* Full Activity Description */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737C74] mb-1.5">
            Activity Description
          </label>
          <div className="bg-[#F7F9F5] rounded-xl p-4 border border-[#E5E9E3] text-sm text-[#252B27] whitespace-pre-wrap leading-relaxed font-normal max-h-48 sm:max-h-56 overflow-y-auto pr-2.5">
            {record.description}
          </div>
        </div>

        {/* Custom Fields (Only shown if populated) */}
        {customFieldEntries.length > 0 && (
          <div className="pt-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737C74] mb-2">
              Custom Field Information
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {customFieldEntries.map(({ field, value }) => (
                <div
                  key={field.id}
                  className="bg-white rounded-lg p-3 border border-[#E5E9E3]"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#737C74] mb-0.5">
                    <FileText className="w-3.5 h-3.5 text-[#315C46]" />
                    <span>{field.name}</span>
                  </div>
                  <p className="text-sm font-medium text-[#252B27]">
                    {Array.isArray(value)
                      ? value.join(', ')
                      : typeof value === 'boolean'
                      ? value
                        ? 'Yes'
                        : 'No'
                      : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Follow-up Items Section */}
        {linkedFollowUps.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737C74]">
                Linked Follow-up Tasks ({linkedFollowUps.length})
              </label>
            </div>
            <div className="space-y-2.5">
              {linkedFollowUps.map((fu) => (
                <div
                  key={fu.id}
                  className="p-3.5 bg-[#F7F9F5] rounded-xl border border-[#E5E9E3] space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-[#E5E9E3] text-[#252B27]">
                        {fu.status}
                      </span>
                      {fu.priority && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            fu.priority === 'high'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : fu.priority === 'medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {fu.priority}
                        </span>
                      )}
                    </div>
                    {fu.due_date && (
                      <span className="text-xs text-[#737C74] font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#315C46]" />
                        <span>Due: {formatDateDisplay(fu.due_date)}</span>
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-[#252B27]">{fu.title}</h4>
                  {fu.description && (
                    <div className="bg-white rounded-lg p-2.5 border border-[#E5E9E3] text-xs text-[#252B27] whitespace-pre-wrap leading-relaxed max-h-32 sm:max-h-36 overflow-y-auto pr-2">
                      {fu.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-4 border-t border-[#E5E9E3] flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                onClose();
                onAddFollowUp(record);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {linkedFollowUps.length > 0 ? 'Add Another Follow-up' : 'Add Follow-up'}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => {
                onClose();
                onEdit(record);
              }}
              leftIcon={<Edit2 className="w-4 h-4" />}
            >
              Edit Record
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

