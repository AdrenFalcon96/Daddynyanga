import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "zw.co.samanyanga.companion",
  appName: "Samanyanga Companion",
  webDir: "dist/public",
  server: {
    androidScheme: "https",
    cleartext: false,
    allowNavigation: ["samanyanga-api.onrender.com"],
  },
  android: {
    buildOptions: {
      keystorePath: "keystore/release.jks",
      keystoreAlias: "samanyanga",
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#14532d",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
  },
};

export default config;
