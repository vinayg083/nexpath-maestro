import { Alert, Linking } from "react-native";

export type OpenableResource = {
  type: string | null;
  url: string | null;
  phone: string | null;
  body: string | null;
  title: string;
};

/** Opens a resource by type: website/youtube → url, hotline → tel, text → alert body. */
export async function openResource(resource: OpenableResource): Promise<void> {
  switch (resource.type) {
    case "hotline": {
      if (resource.phone) {
        await Linking.openURL(`tel:${resource.phone}`);
      }
      return;
    }
    case "text": {
      Alert.alert(resource.title, resource.body?.trim() || "No details available.");
      return;
    }
    case "website":
    case "youtube":
    default: {
      if (resource.url) {
        await Linking.openURL(resource.url);
      }
    }
  }
}

export function canOpenResource(resource: OpenableResource): boolean {
  switch (resource.type) {
    case "hotline":
      return Boolean(resource.phone);
    case "text":
      return true;
    case "website":
    case "youtube":
    default:
      return Boolean(resource.url);
  }
}
