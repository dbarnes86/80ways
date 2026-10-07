import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.atw80ways.app',
  appName: '80 Ways',
  webDir: 'dist',
  backgroundColor: '#05050b',
  ios: {
    contentInset: 'never',
    scheme: '80 Ways',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#05050b',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      overlaysWebView: true,
    },
  },
}

export default config
