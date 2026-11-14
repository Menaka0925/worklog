import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Tag, Check, Plus, Settings2, Trash2, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CustomFieldEditorModal } from '../custom-fields/CustomFieldEditorModal';
import type { RecordEntry } from '../../types/record';
import type { CustomFieldDefinition } from '../../types/customField';
import { useWorkLog } from '../../context/WorkLogContext';
import { getTodayDateString, getCurrentTimeString } from '../../utils/dateUtils';

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: RecordEntry | null;
  defaultDate?: string;
}

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
  isOpen,
  onClose,
  entryToEdit,
  defaultDate,
}) => {
  const {
    addEntry,
    updateEntry,
    customFields,
    deleteCustomField,
    selectedDate,
    categories,
    addCategory,
  } = useWorkLog();

  const [date, setDate] = useState<string>(getTodayDateString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  // Inline Category Addition state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryAddError, setCategoryAddError] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Custom Field modal inside Add Record form
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
  const [fieldToEdit, setFieldToEdit] = useState<CustomFieldDefinition | null>(null);

  // Custom Field Deletion Confirmation Dialog State
  const [customFieldToDelete, setCustomFieldToDelete] = useState<CustomFieldDefinition | null>(null);
  const [isDeletingCustomField, setIsDeletingCustomField] = useState(false);

  const handleOpenCreateField = () => {
    setFieldToEdit(null);
    setIsCustomFieldModalOpen(true);
  };

  const handleOpenEditField = (field: CustomFieldDefinition) => {
    setFieldToEdit(field);
    setIsCustomFieldModalOpen(true);
  };

  const handleDeleteCustomField = (field: CustomFieldDefinition) => {
    setCustomFieldToDelete(field);
  };

  const handleConfirmDeleteCustomField = async () => {
    if (!customFieldToDelete) return;
    setIsDeletingCustomField(true);
    try {
      await deleteCustomField(customFieldToDelete.id);
      setCustomFieldValues((prev) => {
        const next = { ...prev };
        delete next[customFieldToDelete.id];
        return next;
      });
      setCustomFieldToDelete(null);
    } catch (err) {
      console.error('Error deleting custom field:', err);
    } finally {
      setIsDeletingCustomField(false);
    }
  };

  // Initialize form fields when opening or switching entryToEdit
  useEffect(() => {
    if (entryToEdit) {
      setDate(entryToEdit.activity_date);
      setTime(entryToEdit.activity_time);
      setTitle(entryToEdit.title || '');
      setDescription(entryToEdit.description);
      setCategory(entryToEdit.category || '');
      setCustomFieldValues(entryToEdit.custom_field_values || {});
    } else {
      setDate(defaultDate || selectedDate || getTodayDateString());
      setTime(getCurrentTimeString());
      setTitle('');
      setDescription('');
      setCategory('');
      setCustomFieldValues({});
    }
    setIsAddingCategory(false);
    setNewCategoryInput('');
    setCategoryAddError(null);
    setCustomFieldToDelete(null);
    setIsDeletingCustomField(false);
    setErrors({});
  }, [entryToEdit, isOpen, defaultDate, selectedDate]);

  const handleCreateNewCategory = async () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;

    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryAddError('This category already exists');
      return;
    }

    setIsSavingCategory(true);
    setCategoryAddError(null);
    try {
      await addCategory(trimmed);
      setCategory(trimmed);
      setIsAddingCategory(false);
      setNewCategoryInput('');
    } catch (err: any) {
      setCategoryAddError(err?.message || 'Failed to add category');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleCustomFieldChange = (fieldId: string, val: any) => {
    setCustomFieldValues((prev) => ({
      ...prev,
      [fieldId]: val,
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!description.trim()) {
      errs.description = 'Activity description is required';
    }
    if (!date) {
      errs.date = 'Date is required';
    }
    if (!time) {
      errs.time = 'Time is required';
    }

    // Validate required custom fields
    customFields
      .filter((cf) => cf.is_visible && cf.required)
      .forEach((cf) => {
        const val = customFieldValues[cf.id];
        if (val === undefined || val === null || val === '') {
          errs[`cf_${cf.id}`] = `${cf.name} is required`;
        }
      });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        activity_date: date,
        activity_time: time,
        title: title.trim() || undefined,
        description: description.trim(),
        category: category || undefined,
        custom_field_values: customFieldValues,
      };

      if (entryToEdit) {
        await updateEntry(entryToEdit.id, payload);
      } else {
        await addEntry(payload);
      }

      onClose();
    } catch (err) {
      console.error('Error saving record entry:', err);
      setErrors((prev) => ({
        ...prev,
        form: err instanceof Error ? err.message : 'Failed to save record',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleCustomFields = customFields.filter((cf) => cf.is_visible);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={entryToEdit ? 'Edit Activity Record' : 'Record Activity'}
        description="Add a time-stamped note of what you worked on, discussed, or verified."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
              {errors.form}
            </div>
          )}

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              error={errors.date}
              leftIcon={<Calendar className="w-4 h-4" />}
            />
            <Input
              label="Time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              error={errors.time}
              leftIcon={<Clock className="w-4 h-4" />}
            />
          </div>

          {/* Title and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <Input
                label="Activity Title (Optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#252B27]">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCategory((prev) => !prev);
                    setNewCategoryInput('');
                    setCategoryAddError(null);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 hover:text-forest-900 transition-colors cursor-pointer"
                  title="Add new category"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {isAddingCategory && (
                <div className="mb-2 p-2 rounded-lg bg-[#F7F9F5] border border-forest-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Category name..."
                      value={newCategoryInput}
                      onChange={(e) => {
                        setNewCategoryInput(e.target.value);
                        if (categoryAddError) setCategoryAddError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateNewCategory();
                        } else if (e.key === 'Escape') {
                          setIsAddingCategory(false);
                          setNewCategoryInput('');
                          setCategoryAddError(null);
                        }
                      }}
                      className="flex-1 min-w-0 rounded-md border border-[#E5E9E3] bg-white px-2 py-1 text-xs text-[#252B27] placeholder:text-[#737C74] focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                    />
                    <button
                      type="button"
                      disabled={isSavingCategory || !newCategoryInput.trim()}
                      onClick={handleCreateNewCategory}
                      className="px-2.5 py-1 rounded-md bg-forest-700 text-white text-xs font-medium hover:bg-forest-800 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                    >
                      {isSavingCategory ? '...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryInput('');
                        setCategoryAddError(null);
                      }}
                      className="p-1 rounded-md text-[#737C74] hover:text-[#252B27] hover:bg-[#E5E9E3]/50 transition-colors cursor-pointer shrink-0"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {categoryAddError && (
                    <p className="text-[11px] text-rose-600 font-medium">{categoryAddError}</p>
                  )}
                </div>
              )}

              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full rounded-lg border border-[#E5E9E3] py-2 pl-3 pr-8 text-sm bg-white text-[#252B27] focus:border-forest-600 focus:ring-1 focus:ring-forest-600 cursor-pointer"
                >
                  <option value="">
                    {categories.length === 0 ? 'No categories (optional)' : 'Select category (optional)...'}
                  </option>
                  {category && !categories.includes(category) && (
                    <option value={category}>{category}</option>
                  )}
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description (Required) - Multi-language support */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#252B27]">
                Activity Description <span className="text-rose-600">*</span>
              </label>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`block w-full rounded-lg border text-sm p-3 bg-white text-[#252B27] placeholder:text-[#737C74]/60 transition-colors
                ${errors.description
                  ? 'border-rose-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-600'
                  : 'border-[#E5E9E3] focus:border-forest-600 focus:ring-1 focus:ring-forest-600'
                }
              `}
              required
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.description}</p>
            )}
          </div>

          {/* Custom Fields Section */}
          {visibleCustomFields.length > 0 && (
            <div className="pt-3 border-t border-[#E5E9E3]">
              <div className="text-xs font-bold uppercase tracking-wider text-[#252B27] mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-forest-600" />
                  <span>Custom Fields</span>
                </div>
                <span className="text-[11px] text-[#737C74] font-normal lowercase">
                  manage or edit options directly
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {visibleCustomFields.map((cf) => {
                  const errorKey = `cf_${cf.id}`;
                  const val = customFieldValues[cf.id] ?? '';

                  // Checkbox Field (with options list or single checkbox)
                  if (cf.field_type === 'checkbox') {
                    if (cf.options && cf.options.length > 0) {
                      const selectedList: string[] = Array.isArray(val) ? val : [];
                      return (
                        <div key={cf.id} className="p-3 bg-[#F7F8F5] rounded-xl border border-[#E5E9E3] sm:col-span-2">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#252B27]">
                              {cf.name}
                              {cf.required && <span className="text-rose-500 ml-0.5">*</span>}
                            </label>
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditField(cf)}
                                className="text-[11px] text-forest-700 hover:text-forest-900 font-medium flex items-center gap-1 cursor-pointer"
                                title="Edit options"
                              >
                                <Settings2 className="w-3 h-3" />
                                <span>Edit Options</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomField(cf)}
                                className="text-[11px] text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
                                title="Delete custom field"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {cf.options.map((opt) => {
                              const isChecked = selectedList.includes(opt);
                              return (
                                <label key={opt} className="inline-flex items-center gap-2 cursor-pointer text-xs text-[#252B27]">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const next = e.target.checked
                                        ? [...selectedList, opt]
                                        : selectedList.filter((item) => item !== opt);
                                      handleCustomFieldChange(cf.id, next);
                                    }}
                                    className="h-4 w-4 rounded border-[#E5E9E3] text-forest-600 focus:ring-forest-600"
                                  />
                                  <span>{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                          {errors[errorKey] && <p className="mt-1 text-xs text-rose-600">{errors[errorKey]}</p>}
                        </div>
                      );
                    }

                    // Single boolean checkbox
                    return (
                      <div key={cf.id} className="flex items-center justify-between p-3 bg-[#F7F8F5] rounded-xl border border-[#E5E9E3]">
                        <label htmlFor={`cf_${cf.id}`} className="inline-flex items-center gap-2 text-xs font-semibold text-[#252B27] cursor-pointer">
                          <input
                            type="checkbox"
                            id={`cf_${cf.id}`}
                            checked={Boolean(val)}
                            onChange={(e) => handleCustomFieldChange(cf.id, e.target.checked)}
                            className="h-4 w-4 rounded border-[#E5E9E3] text-forest-600 focus:ring-forest-600"
                          />
                          <span>{cf.name}</span>
                        </label>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditField(cf)}
                            className="text-[11px] text-forest-700 hover:text-forest-900 font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Settings2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomField(cf)}
                            className="text-[11px] text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Dropdown Field
                  if (cf.field_type === 'dropdown' || cf.field_type === 'multi_select') {
                    return (
                      <div key={cf.id}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#252B27]">
                            {cf.name}
                            {cf.required && <span className="text-rose-500 ml-0.5">*</span>}
                          </label>
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditField(cf)}
                              className="text-[11px] text-forest-700 hover:text-forest-900 font-medium flex items-center gap-1 cursor-pointer"
                              title="Edit or add extra options"
                            >
                              <Settings2 className="w-3 h-3" />
                              <span>Edit Options</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomField(cf)}
                              className="text-[11px] text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
                              title="Delete custom field"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                        <select
                          value={val}
                          onChange={(e) => handleCustomFieldChange(cf.id, e.target.value)}
                          className="block w-full rounded-lg border border-[#E5E9E3] py-2 px-3 text-sm bg-white text-[#252B27] focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                        >
                          <option value="">Select {cf.name}...</option>
                          {(cf.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        {errors[errorKey] && (
                          <p className="mt-1 text-xs text-rose-600">{errors[errorKey]}</p>
                        )}
                      </div>
                    );
                  }

                  // Text, Number, Date, etc.
                  return (
                    <div key={cf.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#252B27]">
                          {cf.name}
                          {cf.required && <span className="text-rose-500 ml-0.5">*</span>}
                        </span>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditField(cf)}
                            className="text-[11px] text-forest-700 hover:text-forest-900 font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Settings2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomField(cf)}
                            className="text-[11px] text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                      <Input
                        type={
                          cf.field_type === 'number'
                            ? 'number'
                            : cf.field_type === 'date'
                              ? 'date'
                              : cf.field_type === 'time'
                                ? 'time'
                                : cf.field_type === 'email'
                                  ? 'email'
                                  : 'text'
                        }
                        placeholder={`Enter ${cf.name}...`}
                        value={val}
                        onChange={(e) => handleCustomFieldChange(cf.id, e.target.value)}
                        required={cf.required}
                        error={errors[errorKey]}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* "Need More Fields?" Action Bar at Form Bottom */}
          <div className="p-3.5 bg-forest-50/70 rounded-xl border border-forest-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[#252B27]">Need more fields?</p>
              <p className="text-[11px] text-[#737C74]">
                Create custom numbers, dropdowns, checkboxes, or options anytime.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenCreateField}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="shrink-0"
            >
              Add Custom Field
            </Button>
          </div>

          {/* Action Buttons */}
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
              {entryToEdit ? 'Save Changes' : 'Record Activity'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Embedded Custom Field Creator/Editor Dialog */}
      <CustomFieldEditorModal
        isOpen={isCustomFieldModalOpen}
        onClose={() => setIsCustomFieldModalOpen(false)}
        fieldToEdit={fieldToEdit}
      />

      {/* Custom Field Deletion Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!customFieldToDelete}
        title="Delete Custom Field?"
        message={`Are you sure you want to delete the "${customFieldToDelete?.name}" custom field? Historical entries that recorded values for this field will keep their existing data safe.`}
        confirmLabel="Delete Field"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isDeletingCustomField}
        onConfirm={handleConfirmDeleteCustomField}
        onCancel={() => setCustomFieldToDelete(null)}
      />
    </>
  );
};
