import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

import { getInstallId } from '~/lib/install-id';
import { ensureAnonymousSupabaseSession } from '~/lib/supabase/auth';
import { supabase } from '~/lib/supabase/client';

type DevicePlatform = 'ios' | 'android' | 'web';

type DeviceModule = typeof import('expo-device');
type NotificationsModule = typeof import('expo-notifications');

// The device row's UUID. Analytics stamps every event with it.
let deviceId: string | null = null;

export const getDeviceId = () => deviceId;
export const clearDeviceId = () => {
  deviceId = null;
};

function getDevicePlatform(): DevicePlatform {
  if (Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web') {
    return Platform.OS;
  }

  return 'web';
}

function loadDeviceModule(): DeviceModule | null {
  try {
    // Native binary may predate this install — don't crash launch registration.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-device') as DeviceModule;
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.warn('expo-device unavailable', error);
    return null;
  }
}

function loadNotificationsModule(): NotificationsModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as NotificationsModule;
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.warn('expo-notifications unavailable', error);
    return null;
  }
}

function getDeviceModel(Device: DeviceModule | null): string | null {
  const modelName = Device?.modelName ?? null;

  // On iOS Simulator, modelName is usually just "Simulator". The simulator process
  // exposes the exact chosen device (e.g. "iPhone 16 Pro") via env.
  if (
    Platform.OS === 'ios' &&
    Device &&
    !Device.isDevice &&
    (modelName == null || modelName === 'Simulator')
  ) {
    return process.env.SIMULATOR_DEVICE_NAME ?? modelName;
  }

  return modelName;
}

export async function registerDevice() {
  const user = await ensureAnonymousSupabaseSession();

  if (!user) {
    return;
  }

  const Device = loadDeviceModule();

  const { data, error } = await supabase
    .from('user_devices')
    .upsert(
      {
        user_id: user.id,
        install_id: await getInstallId(),
        platform: getDevicePlatform(),
        model: getDeviceModel(Device),
        os_version: Device?.osVersion ?? (Platform.Version != null ? String(Platform.Version) : null),
        app_version: Application.nativeApplicationVersion,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,install_id' }
    )
    .select('id')
    .single();

  if (error) {
    // eslint-disable-next-line no-console
    console.warn('device register failed', error.message);
    return;
  }

  deviceId = data.id;
}

export async function registerPushToken() {
  const Device = loadDeviceModule();
  const Notifications = loadNotificationsModule();

  if (!Device?.isDevice || !Notifications) {
    return;
  }

  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== 'granted') {
    return;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const { data: token } = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { error } = await supabase
    .from('user_devices')
    .update({ push_token: token })
    .eq('user_id', user.id)
    .eq('install_id', await getInstallId());

  if (error) {
    // eslint-disable-next-line no-console
    console.warn('push token register failed', error.message);
  }
}
