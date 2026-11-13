export type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'dropdown'
  | 'multi_select'
  | 'number'
  | 'date'
  | 'time'
  | 'checkbox'
  | 'email'
  | 'url';

export interface CustomFieldDefinition {
  id: string;
  user_id?: string;
  name: string;
  field_type: CustomFieldType;
  options?: string[]; // for dropdown & multi_select
  required: boolean;
  is_visible: boolean;
  display_order: number;
  created_at?: string;
}

