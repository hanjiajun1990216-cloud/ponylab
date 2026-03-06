import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ponylab.app",
  appName: "PonyLab",
  webDir: "out",
  server: {
    // In development, point to the dev server
    // url: "http://localhost:3000",
    // In production, use the bundled web assets
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1e293b", // slate-800
    },
  },
};

export default config;
