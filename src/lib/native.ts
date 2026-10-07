/**
 * Native touches for the Capacitor builds. Every function is a no-op on the web, so callers
 * never need to check the platform.
 */
import { Capacitor } from '@capacitor/core'

export const isNativeApp = () => Capacitor.isNativePlatform()

type HapticKind = 'tap' | 'select' | 'success' | 'warning' | 'error' | 'heavy'

/** A small physical confirmation for a meaningful action. */
export function haptic(kind: HapticKind = 'tap') {
  if (!isNativeApp()) return
  void import('@capacitor/haptics').then(({ Haptics, ImpactStyle, NotificationType }) => {
    switch (kind) {
      case 'tap':
        return Haptics.impact({ style: ImpactStyle.Light })
      case 'heavy':
        return Haptics.impact({ style: ImpactStyle.Heavy })
      case 'select':
        return Haptics.selectionChanged()
      case 'success':
        return Haptics.notification({ type: NotificationType.Success })
      case 'warning':
        return Haptics.notification({ type: NotificationType.Warning })
      case 'error':
        return Haptics.notification({ type: NotificationType.Error })
    }
  }).catch(() => undefined)
}

/** Dark status bar over the app's dark background; hide the splash once React has painted. */
export async function initNativeShell() {
  if (!isNativeApp()) return
  try {
    const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
    ])
    await StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined)
    await SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => undefined)
  } catch {
    /* plugins unavailable */
  }
}
