import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getRemoteConfig } from "firebase/remote-config";

const firebaseConfig = {
  apiKey: "AIzaSyA6QGIylSdAQaubIer6KcEWyYAQWeP0q_k",
  authDomain: "medium-clone-39897.firebaseapp.com",
  projectId: "medium-clone-39897",
  storageBucket: "medium-clone-39897.firebasestorage.app",
  messagingSenderId: "787899416658",
  appId: "1:787899416658:web:19df4a240679621bdddf8b",
  measurementId: "G-JJCC28PTDQ"
};

// Inisialisasi Firebase (menggunakan getApps() agar aman dengan Next.js hot-reloading)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Analytics dan Remote Config hanya boleh dipanggil di sisi client (browser),
// karena Next.js juga berjalan di server (SSR) di mana objek 'window' tidak ada.
let analytics;
let remoteConfig;

if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
  
  remoteConfig = getRemoteConfig(app);
  remoteConfig.defaultConfig = {
    "welcome_message": "Selamat datang di website kami!",
    "show_new_feature": false
  };
}

export { app, auth, googleProvider, githubProvider, analytics, remoteConfig };
