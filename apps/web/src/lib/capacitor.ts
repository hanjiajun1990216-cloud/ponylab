/**
 * Capacitor plugin utilities for mobile-specific features.
 * These are no-ops on web, active when running inside Capacitor native shell.
 */

export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

export function getPlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";
  const cap = (window as any).Capacitor;
  if (!cap) return "web";
  return cap.getPlatform?.() || "web";
}

/**
 * Request camera permission and take a photo (for QR scanning).
 * Falls back gracefully on web.
 */
export async function takePhoto(): Promise<string | null> {
  if (!isNativePlatform()) {
    // Web fallback: use file input
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  }

  try {
    // Dynamic import to avoid bundling on web
    // @ts-expect-error — @capacitor/camera is an optional native dependency
    const { Camera, CameraResultType } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.DataUrl,
    });
    return photo.dataUrl || null;
  } catch {
    return null;
  }
}

/**
 * Register for push notifications (mobile only).
 */
export async function registerPushNotifications(): Promise<string | null> {
  if (!isNativePlatform()) return null;

  try {
    // @ts-expect-error — @capacitor/push-notifications is an optional native dependency
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive === "granted") {
      await PushNotifications.register();
      return new Promise((resolve) => {
        PushNotifications.addListener("registration", (token: any) => {
          resolve(token.value);
        });
        // Timeout after 5s
        setTimeout(() => resolve(null), 5000);
      });
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Apply safe area insets for iOS.
 */
export function applySafeAreaInsets() {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(
    "--safe-area-top",
    "env(safe-area-inset-top, 0px)",
  );
  document.documentElement.style.setProperty(
    "--safe-area-bottom",
    "env(safe-area-inset-bottom, 0px)",
  );
}
