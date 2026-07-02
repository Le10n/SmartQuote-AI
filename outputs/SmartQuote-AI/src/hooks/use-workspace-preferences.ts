import { useCallback, useSyncExternalStore } from "react";
import {
  defaultWorkspacePreferences,
  readWorkspacePreferences,
  setWorkspacePreferences,
  subscribeWorkspacePreferences,
  updateWorkspacePreference,
  type WorkspacePreferences,
} from "@/services/workspace-preferences.service";

export function useWorkspacePreferences() {
  const preferences = useSyncExternalStore(
    subscribeWorkspacePreferences,
    readWorkspacePreferences,
    () => defaultWorkspacePreferences
  );

  const setPreferences = useCallback(
    (
      nextPreferences:
        | WorkspacePreferences
        | ((currentPreferences: WorkspacePreferences) => WorkspacePreferences)
    ) => setWorkspacePreferences(nextPreferences),
    []
  );

  const updatePreference = useCallback(
    <TKey extends keyof WorkspacePreferences>(key: TKey, value: WorkspacePreferences[TKey]) =>
      updateWorkspacePreference(key, value),
    []
  );

  return { preferences, setPreferences, updatePreference };
}
