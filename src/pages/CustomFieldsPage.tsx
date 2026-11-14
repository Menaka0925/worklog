import React, { useState } from 'react';
import { Plus, SlidersHorizontal, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { useWorkLog } from '../context/WorkLogContext';
import { CustomFieldEditorModal } from '../components/custom-fields/CustomFieldEditorModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import type { CustomFieldDefinition } from '../types/customField';

export const CustomFieldsPage: React.FC = () => {
  const { customFields, updateCustomField, deleteCustomField } = useWorkLog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fieldToEdit, setFieldToEdit] = useState<CustomFieldDefinition | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<CustomFieldDefinition | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleVisibility = async (field: CustomFieldDefinition) => {
    await updateCustomField(field.id, { is_visible: !field.is_visible });
  };

  const handleConfirmDelete = async () => {
    if (!fieldToDelete) return;
    setIsDeleting(true);
    await deleteCustomField(fieldToDelete.id);
    setIsDeleting(false);
    setFieldToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#252B27] tracking-tight">Custom Fields</h1>
          <p className="text-xs sm:text-sm text-[#737C74] mt-1">
            Tailor your activity log with your own fields (e.g. Voucher Number, Work Mode, Shift, Client PO). Historical entry data is preserved.
          </p>
        </div>

        <Button
          onClick={() => {
            setFieldToEdit(null);
            setIsModalOpen(true);
          }}
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Custom Field
        </Button>
      </div>

      {/* Fields List */}
      <div className="bg-white rounded-xl border border-[#E5E9E3] shadow-2xs divide-y divide-[#E5E9E3] overflow-hidden">
        {customFields
          .slice()
          .sort((a, b) => a.display_order - b.display_order)
          .map((field) => (
            <div
              key={field.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7F8F5]/60 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-forest-100 text-forest-800 font-mono text-xs font-semibold flex items-center justify-center border border-forest-200">
                    {field.display_order}
                  </span>
                  <h3 className="text-sm font-bold text-[#252B27]">{field.name}</h3>

                  <Badge variant="purple" size="sm">
                    {field.field_type.replace('_', ' ')}
                  </Badge>

                  {field.required && (
                    <Badge variant="danger" size="sm">
                      Required
                    </Badge>
                  )}

                  {!field.is_visible && (
                    <Badge variant="default" size="sm">
                      Hidden
                    </Badge>
                  )}
                </div>

                {field.options && field.options.length > 0 && (
                  <p className="text-xs text-[#737C74] pl-8">
                    Options: {field.options.join(', ')}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pl-8 sm:pl-0">
                <button
                  type="button"
                  onClick={() => handleToggleVisibility(field)}
                  className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                    field.is_visible
                      ? 'text-[#737C74] hover:bg-[#F2F5F0]'
                      : 'text-warm-700 bg-warm-50 hover:bg-warm-100'
                  }`}
                  title={field.is_visible ? 'Hide from Add Note form' : 'Show in Add Note form'}
                >
                  {field.is_visible ? (
                    <>
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Active</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span className="hidden sm:inline">Archived/Hidden</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFieldToEdit(field);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-[#737C74] hover:text-[#252B27] hover:bg-[#F2F5F0] transition-colors cursor-pointer"
                  title="Edit custom field"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setFieldToDelete(field)}
                  className="p-1.5 rounded-lg text-[#737C74] hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete custom field"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

        {customFields.length === 0 && (
          <div className="p-12 text-center">
            <SlidersHorizontal className="w-8 h-8 text-[#737C74] mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-[#252B27]">No custom fields created</h4>
            <p className="text-xs text-[#737C74] mt-1 max-w-sm mx-auto">
              Add your own custom inputs such as voucher numbers, project tags, or work mode.
            </p>
          </div>
        )}
      </div>

      <CustomFieldEditorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFieldToEdit(null);
        }}
        fieldToEdit={fieldToEdit}
      />

      <ConfirmDialog
        isOpen={!!fieldToDelete}
        title="Delete Custom Field?"
        message={`Are you sure you want to remove '${fieldToDelete?.name}'? Historical entries that recorded values for this field will keep their existing data safe.`}
        confirmLabel="Delete Field"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setFieldToDelete(null)}
      />
    </div>
  );
};
