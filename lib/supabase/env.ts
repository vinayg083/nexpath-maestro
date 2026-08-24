import Constants from 'expo-constants';

type SupabaseEnv = {
  url: string;
  restUrl: string;
  anonKey: string;
};

type SupabaseExtra = {
  supabaseUrl?: string;
  supabaseRestUrl?: string;
  supabaseAnonKey?: string;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const normalizeSupabaseUrl = (value: string) => {
  const trimmed = trimTrailingSlash(value.trim());

  return trimmed.replace(/\/rest\/v1$/, '');
};

const buildRestUrl = (url: string) => `${trimTrailingSlash(url)}/rest/v1`;

const requireEnv = (name: string, value: string | undefined) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return trimmed;
};

const assertValidUrl = (name: string, value: string) => {
  try {
    return new URL(value).toString().replace(/\/$/, '');
  } catch {
    throw new Error(`Invalid URL in environment variable: ${name}`);
  }
};

const rawSupabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  process.env.EXPO_PUBLIC_SUPABASE_REST_URL ??
  process.env.API_URL ??
  (Constants.expoConfig?.extra as SupabaseExtra | undefined)?.supabaseUrl ??
  (Constants.expoConfig?.extra as SupabaseExtra | undefined)?.supabaseRestUrl;

const rawSupabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.ANON_key ??
  (Constants.expoConfig?.extra as SupabaseExtra | undefined)?.supabaseAnonKey;

const supabaseUrl = assertValidUrl(
  'EXPO_PUBLIC_SUPABASE_URL',
  normalizeSupabaseUrl(requireEnv('EXPO_PUBLIC_SUPABASE_URL', rawSupabaseUrl))
);

export const supabaseEnv: SupabaseEnv = {
  url: supabaseUrl,
  restUrl: buildRestUrl(supabaseUrl),
  anonKey: requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', rawSupabaseKey),
};
