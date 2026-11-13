export type FollowUpStatus =
  | 'Upcoming'
  | 'Pending'
  | 'In Progress'
  | 'Completed'
  | 'On Hold'
  | 'Carried Forward'
  | 'Cancelled / Rejected';

export interface FollowUpItem {
  id: string;
  user_id?: string;
  record_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  status: FollowUpStatus;
  priority?: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}
