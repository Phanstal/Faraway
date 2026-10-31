import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export async function tapFeedback(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Haptics are optional.
  }
}

export async function breakFeedback(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch {
    // Haptics are optional.
  }
}

export async function completeFeedback(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // Haptics are optional.
  }
}
