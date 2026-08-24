import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

import type { ScreenId } from "./screens";
import { trackScreen } from "./track";

/** Fire `screen_viewed` whenever the screen becomes focused (including back navigations). */
export function useScreenView(screen: ScreenId) {
  useFocusEffect(
    useCallback(() => {
      void trackScreen(screen);
    }, [screen]),
  );
}
