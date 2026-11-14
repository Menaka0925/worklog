export interface RecordEntry {
  id: string;
  user_id?: string;
  activity_date: string; // YYYY-MM-DD
  activity_time: string; // HH:mm
  title?: string;
  description: string; // supports Tamil, Tanglish, English
  category?: string;
  custom_field_values?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SearchFilters {
  query?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
}
