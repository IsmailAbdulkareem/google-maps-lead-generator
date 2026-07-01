export const USAGE_UPDATED_EVENT = "leadgen:usage-updated";

export function notifyUsageUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(USAGE_UPDATED_EVENT));
  }
}
