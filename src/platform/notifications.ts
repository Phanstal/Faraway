import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { NotificationPermissionState } from '../domain/models';

const EYE_BREAK_NOTIFICATION_ID = 4101;

function mapNativePermission(value: string): NotificationPermissionState {
  if (value === 'granted') return 'granted';
  if (value === 'denied') return 'denied';
  return 'not-determined';
}

export async function getNotificationPermission(): Promise<NotificationPermissionState> {
  try {
    if (Capacitor.isNativePlatform()) {
      const result = await LocalNotifications.checkPermissions();
      return mapNativePermission(result.display);
    }

    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return 'not-determined';
  } catch {
    return 'unsupported';
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  try {
    if (Capacitor.isNativePlatform()) {
      const current = await LocalNotifications.checkPermissions();
      if (current.display === 'granted') return 'granted';
      if (current.display === 'denied') return 'denied';
      const result = await LocalNotifications.requestPermissions();
      return mapNativePermission(result.display);
    }

    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    const result = await Notification.requestPermission();
    return result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'not-determined';
  } catch {
    return 'unsupported';
  }
}

export async function scheduleEyeBreakNotification(endsAt: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await cancelEyeBreakNotification();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: EYE_BREAK_NOTIFICATION_ID,
          title: 'Time to look far away',
          body: 'Take in the view about 20 meters away for 20 seconds.',
          schedule: { at: new Date(endsAt), allowWhileIdle: true },
          extra: { screen: 'focus' },
        },
      ],
    });
  } catch {
    // Notifications are a convenience; the in-app timer remains the source of truth.
  }
}

export async function cancelEyeBreakNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: EYE_BREAK_NOTIFICATION_ID }],
    });
  } catch {
    // The notification may never have been scheduled.
  }
}
