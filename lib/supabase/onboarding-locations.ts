import { supabase } from './client';

export type StateOption = {
  value: string;
  label: string;
  has_local_areas: boolean;
};

export type AreaOption = {
  value: string;
  label: string;
};

export type CommunityDurationOption = {
  value: string;
  label: string;
};

export async function getStates() {
  const { data, error } = await supabase
    .from('states')
    .select('code, name, has_local_areas')
    .eq('is_active', true)
    .order('name');

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    value: row.code,
    label: row.name,
    has_local_areas: row.has_local_areas === true,
  }));
}

export async function getAreas(stateCode: string) {
  const { data, error } = await supabase
    .from('areas')
    .select('value:id, label:name')
    .eq('state_code', stateCode)
    .eq('is_active', true)
    .order('name')
    .returns<AreaOption[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getCommunityDurations() {
  const { data, error } = await supabase
    .from('community_durations')
    .select('value:id, label')
    .eq('is_active', true)
    .order('sort_order')
    .returns<CommunityDurationOption[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}
