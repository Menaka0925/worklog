import React, { useState, useEffect } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import type { CustomFieldDefinition, CustomFieldType } from '../../types/customField';
import { useWorkLog } from '../../context/WorkLogContext';

interface CustomFieldEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldToEdit?: CustomFieldDefinition | null;
}

const FIELD_TYPES: { type: CustomFieldType; label: string }[] = [
  { type: 'number', label: 'Number Only' },
  { type: 'dropdown', label: 'Dropdown (Selectable Options)' },
  { type: 'checkbox', label: 'Checkbox (Multiple Options)' },
  { type: 'text', label: 'Short Text' },
  { type: 'textarea', label: 'Long Text / Remarks' },
  { type: 'date', label: 'Date' },
];

export const CustomFieldEditorModal: React.FC<CustomFieldEditorModalProps> = ({
  isOpen,
  onClose,
  fieldToEdit,
}) => {
  const { addCustomField, updateCustomField, deleteCustomField, customFields } = useWorkLog();

  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState<CustomFieldType>('number');
  const [required, setRequired] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [options, setOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiresOptions = fieldType === 'dropdown' || fieldType === 'checkbox' || fieldType === 'multi_select';

  useEffect(() => {
    if (fieldToEdit) {
      setName(fieldToEdit.name);
      setFieldType(fieldToEdit.field_type);
      setRequired(fieldToEdit.required);
      setIsVisible(fieldToEdit.is_visible);
      setOptions(fieldToEdit.options || []);
    } else {
      setName('');
      setFieldType('number');
      setRequired(false);
      setIsVisible(true);
      setOptions([]);
    }
    setNewOptionInput('');
    setError(null);
  }, [fieldToEdit, isOpen]);

  const handleAddOption = () => {
    const trimmed = newOptionInput.trim();
    if (trimmed && !options.includes(trimmed)) {
      setOptions([...options, trimmed]);
      setNewOptionInput('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Field Name is required');
      return;
    }

    if (requiresOptions && options.length === 0) {
      setError(`Please provide at least one option for ${fieldType} (e.g. Option 1, Option 2)`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        field_type: fieldType,
        required,
        is_visible: isVisible,
        display_order: fieldToEdit ? fieldToEdit.display_order : customFields.length + 1,
        options: requiresOptions ? options : undefined,
      };

      if (fieldToEdit) {
        await updateCustomField(fieldToEdit.id, payload);
      } else {
        await addCustomField(payload);
      }

      onClose();
    } catch (err) {
      console.error('Error saving custom field:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteField = async () => {
    if (!fieldToEdit) return;
    if (window.confirm(`Are you sure you want to delete the "${fieldToEdit.name}" custom field?`)) {
      setIsSubmitting(true);
      try {
        await deleteCustomField(fieldToEdit.id);
        onClose();
      } catch (err) {
        console.error('Error deleting custom field:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={fieldToEdit ? `Edit Custom Field: ${fieldToEdit.name}` : 'Add New Custom Field'}
      description="Create or edit your own custom input fields. You can include extra options at any time."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        <Input
          label="Field Name"
          placeholder="e.g. Voucher Number, Batch Code, Shift, Department"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#252B27] mb-1.5">
            Input Type
          </label>
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value as CustomFieldType)}
            className="block w-full rounded-lg border border-[#E5E9E3] py-2 px-3 text-sm bg-white text-[#252B27] focus:border-forest-600 focus:ring-1 focus:ring-forest-600 cursor-pointer"
          >
            {FIELD_TYPES.map((ft) => (
              <option key={ft.type} value={ft.type}>
                {ft.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown / Checkbox options manager */}
        {requiresOptions && (
          <div className="p-3.5 bg-[#F7F8F5] rounded-xl border border-[#E5E9E3] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#252B27]">
                Options for {fieldType === 'checkbox' ? 'Checkboxes' : 'Dropdown'}
              </label>
              <span className="text-[11px] text-[#737C74]">
                {options.length} {options.length === 1 ? 'option' : 'options'}
              </span>
            </div>
            <p className="text-xs text-[#737C74]">
              Add choices for this field (e.g. Option 1, Option 2). You can add more options later whenever needed.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder={`Enter option label (e.g. Option ${options.length + 1})...`}
                value={newOptionInput}
                onChange={(e) => setNewOptionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOption();
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddOption}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Option
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {options.map((opt, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#E5E9E3] text-xs font-medium text-[#252B27] shadow-2xs"
                >
                  <span className="text-forest-600 font-bold text-[10px]">{idx + 1}.</span>
                  <span>{opt}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="text-[#737C74] hover:text-rose-700 cursor-pointer p-0.5"
                    title="Remove option"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {options.length === 0 && (
                <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                  Please add at least one option (e.g. Option 1, Option 2).
                </span>
              )}
            </div>
          </div>
        )}

        {/* Checkbox settings */}
        <div className="flex flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-4 w-4 rounded border-[#E5E9E3] text-forest-600 focus:ring-forest-600"
            />
            <span className="text-xs font-medium text-[#252B27]">Required field</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              className="h-4 w-4 rounded border-[#E5E9E3] text-forest-600 focus:ring-forest-600"
            />
            <span className="text-xs font-medium text-[#252B27]">
              Visible on Add Record form
            </span>
          </label>
        </div>

        <div className="pt-4 border-t border-[#E5E9E3] flex items-center justify-between">
          {fieldToEdit ? (
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={handleDeleteField}
              disabled={isSubmitting}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Field
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
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
              {fieldToEdit ? 'Save Field' : 'Create Field'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
