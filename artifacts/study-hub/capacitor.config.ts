import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "zw.co.samanyanga.studyhub",
  appName: "Samanyanga Study Hub",
  webDir: "dist/public",
  server: {
    androidScheme: "https",
    cleartext: false,
    url: process.env.VITE_API_URL ?? undefined,
  },
  android: {
    buildOptions: {
      keystorePath: "keystore/release.jks",
      keystoreAlias: "studyhub",
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f172a",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
  },
};

export default config;
