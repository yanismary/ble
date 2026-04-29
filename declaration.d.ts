// src/declarations.d.ts

//type ScanResult = any;

declare module '@capacitor/core' {
  export const Capacitor: any;
  export const Plugins: any;
}

declare module '@capacitor/app' { export const App: any; }
declare module '@capacitor/device' { export const Device: any; }
declare module '@capacitor/haptics' { export const Haptics: any; }
declare module '@capacitor/keyboard' { export const Keyboard: any; }
declare module '@capacitor/status-bar' { export const StatusBar: any; }
declare module '@capacitor/splash-screen' { export const SplashScreen: any; }
declare module 'buffer';

// Bluetooth-LE (empêche TS2.6 d'ouvrir leurs .d.ts modernes)
declare module '@capacitor-community/bluetooth-le' {
  export const BleClient: any;
}
