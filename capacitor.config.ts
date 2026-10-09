import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.atw80ways.app',
  appName: '80 Ways',
  webDir: 'dist',
  backgroundColor: '#0E1526',
  ios: {
    contentInset: 'never',
    scheme: '80 Ways',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0E1526',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      overlaysWebView: true,
    },
  },
}

export default config
