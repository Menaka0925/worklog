import React, { createContext, useContext, useEffect, useState } from 'react';
import type { RecordEntry } from '../types/record';
import type { FollowUpItem } from '../types/followup';
import type { CustomFieldDefinition } from '../types/customField';
import type { WorkProfile } from '../types/auth';
import { getTodayDateString } from '../utils/dateUtils';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

export const DEFAULT_CATEGORIES: string[] = [];

interface WorkLogContextType {
  entries: RecordEntry[];
  followUps: FollowUpItem[];
  customFields: CustomFieldDefinition[];
  categories: string[];
  workProfile: WorkProfile;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  // Entries
  addEntry: (data: Omit<RecordEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<RecordEntry>;
  updateEntry: (id: string, data: Partial<RecordEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  // Follow-ups
  addFollowUp: (data: Omit<FollowUpItem, 'id' | 'created_at' | 'updated_at'>) => Promise<FollowUpItem>;
  updateFollowUp: (id: string, data: Partial<FollowUpItem>) => Promise<void>;
  deleteFollowUp: (id: string) => Promise<void>;
  // Custom Fields
  addCustomField: (data: Omit<CustomFieldDefinition, 'id'>) => Promise<void>;
  updateCustomField: (id: string, data: Partial<CustomFieldDefinition>) => Promise<void>;
  deleteCustomField: (id: string) => Promise<void>;
  // Categories
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  // Work Profile
  updateWorkProfile: (profile: Partial<WorkProfile>) => Promise<void>;
  // Refresh
  refreshData: () => Promise<void>;
}

const WorkLogContext = createContext<WorkLogContextType | undefined>(undefined);

export const WorkLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Pure Supabase state
  const [entries, setEntries] = useState<RecordEntry[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [workProfile, setWorkProfile] = useState<WorkProfile>({});

  // Load from Supabase if configured and user is authenticated
  const refreshData = async () => {
    if (!isSupabaseConfigured() || !supabase || !user) return;

    try {
      // 1. Fetch records
      const { data: entriesData, error: eErr } = await supabase
        .from('records')
        .select('*')
        .eq('user_id', user.id)
        .order('activity_time', { ascending: true });

      if (eErr) {
        console.error('Supabase fetch records error:', eErr);
      } else if (entriesData) {
        setEntries(entriesData);
      }

      // 2. Fetch follow-ups
      const { data: fuData, error: fuErr } = await supabase
        .from('follow_ups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fuErr) {
        console.error('Supabase fetch follow-ups error:', fuErr);
      } else if (fuData) {
        setFollowUps(fuData);
      }

      // 3. Fetch custom fields
      const { data: cfData, error: cfErr } = await supabase
        .from('custom_fields')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });

      if (!cfErr && cfData) {
        setCustomFields(cfData);
      }

      // 4. Fetch custom categories if exists
      const { data: catData, error: catErr } = await supabase
        .from('user_categories')
        .select('name')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (!catErr && catData && catData.length > 0) {
        setCategories(catData.map((c: { name: string }) => c.name));
      }

      // 5. Fetch user profile
      const { data: profData, error: profErr } = await supabase
        .from('user_profiles')
        .select('industry, job_role, work_type')
        .eq('id', user.id)
        .single();

      if (!profErr && profData) {
        setWorkProfile({
          industry: profData.industry || undefined,
          job_role: profData.job_role || undefined,
          work_type: profData.work_type || undefined,
        });
      }
    } catch (err) {
      console.error('Supabase sync error:', err);
    }
  };

  useEffect(() => {
    if (user && isSupabaseConfigured()) {
      refreshData();
    } else if (!user) {
      // Clear data on logout so different browser or user never sees old state
      setEntries([]);
      setFollowUps([]);
      setCustomFields([]);
      setCategories([]);
      setWorkProfile({});
    }
  }, [user]);

  // Entry operations
  const addEntry = async (
    data: Omit<RecordEntry, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RecordEntry> => {
    if (!isSupabaseConfigured() || !supabase || !user) {
      throw new Error('Supabase is not configured or user is not logged in.');
    }

    const now = new Date().toISOString();
    const newEntry: RecordEntry = {
      ...data,
      id: 'entry-' + Date.now(),
      user_id: user.id,
      created_at: now,
      updated_at: now,
    };

    const { data: inserted, error } = await supabase
      .from('records')
      .insert(newEntry)
      .select()
      .single();

    if (error) {
      console.error('Supabase add entry error:', error);
      throw error;
    }

    if (inserted) {
      setEntries((prev) => [inserted, ...prev]);
      return inserted;
    }

    setEntries((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  const updateEntry = async (id: string, data: Partial<RecordEntry>): Promise<void> => {
    if (!isSupabaseConfigured() || !supabase || !user) {
      throw new Error('Supabase is not configured or user is not logged in.');
    }

    const updatedNow = new Date().toISOString();
    const { error } = await supabase
      .from('records')
      .update({ ...data, updated_at: updatedNow })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase update entry error:', error);
      throw error;
    }

    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...data, updated_at: updatedNow } : e))
    );
  };

  const deleteEntry = async (id: string): Promise<void> => {
    if (!isSupabaseConfigured() || !supabase || !user) {
      throw new Error('Supabase is not configured or user is not logged in.');
    }

    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase delete entry error:', error);
      throw error;
    }

    setEntries((prev) => prev.filter((e) => e.id !== id));
    setFollowUps((prev) => prev.filter((f) => f.record_id !== id));
  };

  // Follow-ups
  const addFollowUp = async (
    data: Omit<FollowUpItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<FollowUpItem> => {
    if (!isSupabaseConfigured() || !supabase || !user) {
      throw new Error('Supabase is not configured or user is not logged in.');
    }

    const now = new Date().toISOString();
    const newItem: FollowUpItem = {
      ...data,
      id: 'fu-' + Date.now(),
      user_id: user.id,
      created_at: now,
      updated_at: now,
    };

    const { data: inserted, error } = await supabase
      .from('follow_ups')
      .insert(newItem)
      .select()
      .single();

    if (error) {
      console.error('Supabase add follow up error:', error);
      throw error;
    }

    if (inserted) {
      setFollowUps((prev) => [inserted, ...prev]);
      return inserted;
    }

    setFollowUps((prev) => [newItem, ...prev]);
    return newItem;
  };

  const updateFollowUp = async (id: string, data: Partial<FollowUpItem>): Promise<void> => {
    if (!isSupabaseConfigured() || !supabase || !user) {
      throw new Error('Supabase is not configured or user is not logged in.');
    }

    const updatedNow = new Date().toISOString();
    const { error } = await supabase
      .from('follow_ups')
      .update({ ...data, updated_at: updatedNow })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase update follow up error:', error);
      throw error;
    }

    setFollowUps((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...data, updated_at: updatedNow } : f))
    );
  };

  const deleteFollowUp = async (id: string): Promise<void> => {
    if (!isSupabaseConfigured() || !supabase || !user) {
      throw new Error('Supabase is not configured or user is not logged in.');
    }

    const { error } = await supabase
      .from('follow_ups')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase delete follow up error:', error);
      throw error;
    }

    setFollowUps((prev) => prev.filter((f) => f.id !== id));
  };

  // Custom Fields
  const addCustomField = async (data: Omit<CustomFieldDefinition, 'id'>): Promise<void> => {
    if (!isSupabaseConfigured() || !supabase || !user) {
      throw new Error('Supabase is not configured or user is not logged in.');
    }

    const newField: CustomFieldDefinition = {
      ...data,
      id: 'cf-' + Date.now(),
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('custom_fields').insert(newField);

    if (error) {
      console.error('Supabase add custom field error:', error);
      throw error;
    }

    setCustomFields((prev) => [...prev, newField]);
  };

  const updateCustomField = async (
    id: string,
    data: Partial<CustomFieldDefinition>
  ): Promise<void> => {
    if (!isSupabaseConfigured() || !supabase || !user) {
      throw new Error('Supabase is not configured or user is not logged in.');
    }

    const { error } = await supabase
      .from('custom_fields')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase update custom field error:', error);
      throw error;
    }

    setCustomFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...data } : f)));
  };

  const deleteCustomField = async (id: string): Promise<void> => {
    if (!isSupabaseConfigured() || !supabase || !user) {
      throw new Error('Supabase is not configured or user is not logged in.');
    }

    const { error } = await supabase
      .from('custom_fields')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase delete custom field error:', error);
      throw error;
    }

    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  // Configurable Categories
  const addCategory = async (name: string): Promise<void> => {
    const trimmed = name.trim();
    if (!trimmed || categories.includes(trimmed)) return;

    if (!isSupabaseConfigured() || !supabase || !user) {
      throw new Error('Supabase is not configured or user is not logged in.');
    }

    const { error } = await supabase.from('user_categories').insert({
      id: 'cat-' + Date.now(),
      user_id: user.id,
      name: trimmed,
    });

    if (error) {
      console.error('Supabase add category error:', error);
      throw error;
    }

    setCategories((prev) => [...prev, trimmed]);
  };

  const deleteCategory = async (name: string): Promise<void> => {
    if (!isSupabaseConfigured() || !supabase || !user) {
      throw new Error('Supabase is not configured or user is not logged in.');
    }

    const { error } = await supabase
      .from('user_categories')
      .delete()
      .eq('user_id', user.id)
      .eq('name', name);

    if (error) {
      console.error('Supabase delete category error:', error);
      throw error;
    }

    setCategories((prev) => prev.filter((c) => c !== name));
  };

  // Work Profile
  const updateWorkProfile = async (profileUpdate: Partial<WorkProfile>): Promise<void> => {
    const updated = { ...workProfile, ...profileUpdate };

    if (!isSupabaseConfigured() || !supabase || !user) {
      throw new Error('Supabase is not configured or user is not logged in.');
    }

    const { error } = await supabase.from('user_profiles').upsert(
      {
        id: user.id,
        industry: updated.industry,
        job_role: updated.job_role,
        work_type: updated.work_type,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.error('Supabase update work profile error:', error);
      throw error;
    }

    setWorkProfile(updated);
  };

  return (
    <WorkLogContext.Provider
      value={{
        entries,
        followUps,
        customFields,
        categories,
        workProfile,
        selectedDate,
        setSelectedDate,
        addEntry,
        updateEntry,
        deleteEntry,
        addFollowUp,
        updateFollowUp,
        deleteFollowUp,
        addCustomField,
        updateCustomField,
        deleteCustomField,
        addCategory,
        deleteCategory,
        updateWorkProfile,
        refreshData,
      }}
    >
      {children}
    </WorkLogContext.Provider>
  );
};

export const useWorkLog = () => {
  const context = useContext(WorkLogContext);
  if (!context) {
    throw new Error('useWorkLog must be used within a WorkLogProvider');
  }
  return context;
};

// Aliases for WorkTrace naming
export const useWorkTrace = useWorkLog;
export const WorkTraceProvider = WorkLogProvider;
