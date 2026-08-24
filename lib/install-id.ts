import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nexpath.install_id';

async function getStoredInstallId() {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(KEY);
  }

  return SecureStore.getItemAsync(KEY);
}

async function setStoredInstallId(id: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(KEY, id);
    return;
  }

  await SecureStore.setItemAsync(KEY, id);
}

export async function clearInstallId() {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(KEY);
    return;
  }

  await SecureStore.deleteItemAsync(KEY);
}

export async function getInstallId() {
  let id = await getStoredInstallId();

  if (!id) {
    id = Crypto.randomUUID();
    await setStoredInstallId(id);
  }

  return id;
}
