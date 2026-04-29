import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mantion.app',
  appName: 'MANTION_SMT',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },

  plugins: {
    StatusBar: {
      overlayWebView: false,
      style: 'DARK',
      backgroundColor: '#2b5898',
      overlay: false
    }
  }
};

export default config;
