import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.phanstal.faraway',
  appName: 'Faraway',
  webDir: 'dist',
  backgroundColor: '#fcfcfa',
  ios: {
    contentInset: 'never',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
