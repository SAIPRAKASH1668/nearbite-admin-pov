import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yumdude.admin',
  appName: 'NearBite Admin',
  webDir: 'dist/nearbite-admin/browser',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0D0D0D',
  },
  ios: {
    backgroundColor: '#0D0D0D',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0D0D0D',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#111111',
    },
  },
};

export default config;
