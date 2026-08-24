import { supabase } from "./client";
import { initializeAppSession } from "@/lib/app-session";
import { clearInstallId } from "@/lib/install-id";
import { cancelAllAppointmentReminders } from "@/lib/notifications/appointment-reminders";
import { clearDeviceId } from "@/lib/register-device";

async function logFunctionsError(error: unknown) {
  // eslint-disable-next-line no-console

  if (
    error &&
    typeof error === "object" &&
    "context" in error &&
    error.context &&
    typeof (error.context as Response).json === "function"
  ) {
    try {
      const body = await (error.context as Response).clone().json();
      // eslint-disable-next-line no-console
      console.log("delete-account error body", body);
    } catch {
      try {
        const text = await (error.context as Response).clone().text();
        // eslint-disable-next-line no-console
        console.log("delete-account error text", text);
      } catch {
        // ignore
      }
    }
  }
}

export async function deleteAccount() {
  const response = await supabase.functions.invoke("delete-account");

  // eslint-disable-next-line no-console
  console.log("delete-account response", response);
  // eslint-disable-next-line no-console
  console.log("delete-account data", response.data);
  // eslint-disable-next-line no-console
  console.log("delete-account error", response.error);

  const { data, error } = response;

  if (error) {
    await logFunctionsError(error);
    throw error;
  }

  const [signOutResult, clearInstallIdResult] = await Promise.allSettled([
    supabase.auth.signOut({ scope: "local" }),
    clearInstallId(),
    // Clear any on-device appointment reminders so none can fire post-deletion.
    cancelAllAppointmentReminders(),
  ]);
  clearDeviceId();

  if (signOutResult.status === "rejected") {
    throw signOutResult.reason;
  }

  if (signOutResult.value.error) {
    throw signOutResult.value.error;
  }

  if (clearInstallIdResult.status === "rejected") {
    throw clearInstallIdResult.reason;
  }

  // A route change does not remount the root layout, so rerun its launch bootstrap.
  await initializeAppSession();

  return data;
}
